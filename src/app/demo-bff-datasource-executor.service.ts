import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  NgxLowcodeDatasourceDefinition,
  NgxLowcodeDatasourceExecutor,
  NgxLowcodeDatasourceRequest
} from 'ngx-lowcode-core-types';
import { createTenantSeedRows } from './demo-project-schema';

interface DemoQueryRequest {
  table: string;
  fields: string[];
  filters?: Record<string, string | number | boolean>;
  tenantId: string;
  userId: string;
  roles: string[];
  limit?: number;
}

interface DemoQueryResponse {
  rows: unknown[];
}

interface DemoMutationRequest {
  table: string;
  operation: 'create' | 'update' | 'delete';
  tenantId: string;
  userId: string;
  roles: string[];
  key?: Record<string, string>;
  data?: Record<string, string>;
}

interface DemoMutationResponse {
  rowCount: number;
  row: unknown | null;
}

type DemoQuerySource = 'bff' | 'fallback';
type DemoQueryStatus = 'success' | 'fallback' | 'error';
type DemoRecordRow = Record<string, string>;

export interface DemoQueryExecutionSnapshot {
  requestId: string;
  source: DemoQuerySource;
  status: DemoQueryStatus;
  tenantId: string;
  rowCount: number;
  message: string;
  happenedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DemoBffDatasourceExecutorService {
  private readonly tenantStores = new Map<string, DemoRecordRow[]>();

  readonly lastExecution = signal<DemoQueryExecutionSnapshot>({
    requestId: '-',
    source: 'bff',
    status: 'success',
    tenantId: 'tenant-a',
    rowCount: 0,
    message: 'ready',
    happenedAt: new Date().toISOString()
  });

  constructor(private readonly http: HttpClient) {}

  execute: NgxLowcodeDatasourceExecutor = async ({
    datasource,
    state,
    payload
  }: NgxLowcodeDatasourceRequest) => {
    if (datasource.type === 'local-payload') {
      return extractPayloadField(payload, String(datasource.request?.params?.['field'] ?? 'id'));
    }

    const operation = resolveMutationOperation(datasource.id);
    if (operation) {
      return this.mutateRecord(datasource, state, operation);
    }

    return this.queryRecords(datasource, state);
  };

  private async queryRecords(
    datasource: NgxLowcodeDatasourceDefinition,
    state: Record<string, unknown>
  ): Promise<DemoRecordRow[]> {
    const endpoint = resolveEndpoint(datasource);
    const payload = toQueryPayload(datasource, state);
    const requestId = crypto.randomUUID();
    const store = this.getTenantStore(payload.tenantId, resolveTable(datasource), datasource);

    try {
      const response = await firstValueFrom(
        this.http.post<DemoQueryResponse>(endpoint, payload, {
          headers: {
            'x-request-id': requestId
          }
        })
      );
      const rows = normalizeRows(response.rows, payload.tenantId);
      this.tenantStores.set(getStoreKey(payload.tenantId, payload.table), rows);
      const filteredRows = filterRows(rows, state, payload.tenantId);
      this.recordExecution({
        requestId,
        source: 'bff',
        status: 'success',
        tenantId: payload.tenantId,
        rowCount: filteredRows.length,
        message: 'query succeeded'
      });
      return filteredRows;
    } catch (error) {
      if (shouldFallback(error)) {
        const rows = filterRows(store, state, payload.tenantId);
        this.recordExecution({
          requestId,
          source: 'fallback',
          status: 'fallback',
          tenantId: payload.tenantId,
          rowCount: rows.length,
          message: resolveErrorMessage(error)
        });
        return rows;
      }

      this.recordExecution({
        requestId,
        source: 'bff',
        status: 'error',
        tenantId: payload.tenantId,
        rowCount: 0,
        message: resolveErrorMessage(error)
      });
      throw error;
    }
  }

  private async mutateRecord(
    datasource: NgxLowcodeDatasourceDefinition,
    state: Record<string, unknown>,
    operation: DemoMutationRequest['operation']
  ): Promise<DemoRecordRow | null> {
    const endpoint = resolveMutationEndpoint(datasource);
    const payload = toMutationPayload(datasource, state, operation);
    const requestId = crypto.randomUUID();

    try {
      const response = await firstValueFrom(
        this.http.post<DemoMutationResponse>(endpoint, payload, {
          headers: {
            'x-request-id': requestId
          }
        })
      );
      if (response.rowCount < 1) {
        throw new Error(`${operation} affected no rows`);
      }
      this.recordExecution({
        requestId,
        source: 'bff',
        status: 'success',
        tenantId: payload.tenantId,
        rowCount: response.rowCount,
        message: `${operation} succeeded`
      });
      return response.row && typeof response.row === 'object'
        ? normalizeRow(response.row as Record<string, unknown>, payload.tenantId)
        : null;
    } catch (error) {
      this.recordExecution({
        requestId,
        source: 'bff',
        status: 'error',
        tenantId: payload.tenantId,
        rowCount: 0,
        message: resolveErrorMessage(error)
      });
      throw error;
    }
  }

  private getTenantStore(
    tenantId: string,
    table: string,
    datasource?: NgxLowcodeDatasourceDefinition
  ): DemoRecordRow[] {
    const storeKey = getStoreKey(tenantId, table);
    const existing = this.tenantStores.get(storeKey);
    if (existing) {
      return existing;
    }

    const seedRows =
      datasource?.mockData && Array.isArray(datasource.mockData)
        ? normalizeRows(datasource.mockData, tenantId)
        : createTenantSeedRows(table, tenantId);
    this.tenantStores.set(storeKey, seedRows);
    return seedRows;
  }

  private recordExecution(execution: Omit<DemoQueryExecutionSnapshot, 'happenedAt'>): void {
    this.lastExecution.set({
      ...execution,
      happenedAt: new Date().toISOString()
    });
  }
}

function resolveMutationOperation(
  datasourceId: string
): DemoMutationRequest['operation'] | null {
  if (datasourceId.endsWith('-create-datasource')) {
    return 'create';
  }
  if (datasourceId.endsWith('-update-datasource')) {
    return 'update';
  }
  if (datasourceId.endsWith('-delete-datasource')) {
    return 'delete';
  }
  return null;
}

function resolveEndpoint(datasource: NgxLowcodeDatasourceDefinition): string {
  const configured = String(datasource.request?.url ?? '').trim();
  if (configured) {
    if (/^https?:\/\//.test(configured)) {
      return configured;
    }
    return `${resolveBaseUrl()}${configured.startsWith('/') ? '' : '/'}${configured}`;
  }
  return `${resolveBaseUrl()}/query`;
}

function resolveBaseUrl(): string {
  const runtimeValue = (globalThis as { __LC_BFF_URL__?: unknown }).__LC_BFF_URL__;
  if (typeof runtimeValue === 'string' && runtimeValue.trim()) {
    return runtimeValue.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

function resolveMutationEndpoint(datasource: NgxLowcodeDatasourceDefinition): string {
  const configured = String(datasource.request?.url ?? '').trim();
  if (configured) {
    if (/^https?:\/\//.test(configured)) {
      return configured;
    }
    return `${resolveBaseUrl()}${configured.startsWith('/') ? '' : '/'}${configured}`;
  }
  return `${resolveBaseUrl()}/mutation`;
}

function toQueryPayload(
  datasource: NgxLowcodeDatasourceDefinition,
  state: Record<string, unknown>
): DemoQueryRequest {
  const tenantId = String(state['tenantId'] ?? 'tenant-a');
  const userId = String(state['userId'] ?? `${tenantId}-user`);
  const roles = normalizeRoles(state['roles']);

  return {
    table: resolveTable(datasource),
    fields: resolveFields(datasource),
    filters: resolveFilters(state),
    tenantId,
    userId,
    roles,
    limit: 100
  };
}

function toMutationPayload(
  datasource: NgxLowcodeDatasourceDefinition,
  state: Record<string, unknown>,
  operation: DemoMutationRequest['operation']
): DemoMutationRequest {
  const tenantId = String(state['tenantId'] ?? 'tenant-a');
  const userId = String(state['userId'] ?? `${tenantId}-user`);
  const roles = normalizeRoles(state['roles']);
  const table = resolveTable(datasource);
  const keyField = String(datasource.request?.params?.['keyField'] ?? 'id');
  const fieldStateMap = resolveFieldStateMap(datasource);
  const keyValue = String(state[fieldStateMap[keyField] ?? `form_${keyField}`] ?? state['selectedRecordId'] ?? '').trim();

  const data =
    operation === 'delete'
      ? undefined
      : Object.entries(fieldStateMap).reduce<Record<string, string>>((acc, [fieldName, stateKey]) => {
          acc[fieldName] = String(state[stateKey] ?? '').trim();
          return acc;
        }, {});

  return {
    table,
    operation,
    tenantId,
    userId,
    roles,
    key: {
      [keyField]: keyValue
    },
    data
  };
}

function resolveFieldStateMap(datasource: NgxLowcodeDatasourceDefinition): Record<string, string> {
  const raw = datasource.request?.params?.['fieldStateMap'];
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.entries(raw as Record<string, unknown>).reduce<Record<string, string>>((acc, [field, stateKey]) => {
      acc[field] = String(stateKey);
      return acc;
    }, {});
  }
  return resolveFields(datasource).reduce<Record<string, string>>((acc, field) => {
    acc[field] = `form_${field}`;
    return acc;
  }, {});
}

function resolveTable(datasource: NgxLowcodeDatasourceDefinition): string {
  const params = datasource.request?.params;
  const tableFromParams = typeof params?.['table'] === 'string' ? params['table'].trim() : '';
  if (tableFromParams) {
    return tableFromParams;
  }

  const target = datasource.command?.target ?? '';
  if (target.includes('.')) {
    return target.split('.')[0];
  }

  return 'orders';
}

function resolveFields(datasource: NgxLowcodeDatasourceDefinition): string[] {
  const params = datasource.request?.params;
  const fields = params?.['fields'];
  if (Array.isArray(fields) && fields.every((item) => typeof item === 'string')) {
    return fields;
  }
  return ['id'];
}

function resolveFilters(state: Record<string, unknown>): Record<string, string | number | boolean> {
  const filters: Record<string, string | number | boolean> = {};

  Object.entries(state).forEach(([key, value]) => {
    if (!key.startsWith('filter_')) {
      return;
    }
    appendFilter(filters, key.replace(/^filter_/, ''), value);
  });

  ['keyword', 'owner', 'channel', 'priority', 'status'].forEach((legacyKey) => {
    appendFilter(filters, legacyKey, state[legacyKey]);
  });

  return filters;
}

function appendFilter(
  target: Record<string, string | number | boolean>,
  key: string,
  value: unknown
): void {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized || normalized === 'all') {
      return;
    }
    target[key] = normalized;
    return;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    target[key] = value;
  }
}

function normalizeRoles(input: unknown): string[] {
  if (Array.isArray(input) && input.every((item) => typeof item === 'string')) {
    return input.length > 0 ? input : ['USER'];
  }
  return ['USER'];
}

function shouldFallback(error: unknown): boolean {
  return error instanceof HttpErrorResponse && [0, 502, 503, 504].includes(error.status);
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }
    return error.message || `HTTP ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? 'unknown error');
}

function filterRows(
  rows: DemoRecordRow[],
  state: Record<string, unknown>,
  tenantId: string
): DemoRecordRow[] {
  const filters = resolveFilters(state);

  return rows.filter((row) => {
    const rowTenant = String(row['tenant_id'] ?? '');
    const tenantMatched = !rowTenant || rowTenant === tenantId;
    return (
      tenantMatched &&
      Object.entries(filters).every(([key, value]) => {
        if (key === 'keyword') {
          return Object.values(row)
            .map((item) => String(item).toLowerCase())
            .some((item) => item.includes(String(value).toLowerCase()));
        }
        return String(row[key] ?? '').toLowerCase().includes(String(value).toLowerCase());
      })
    );
  });
}

function normalizeRows(input: unknown, tenantId: string): DemoRecordRow[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => normalizeRow(item as Record<string, unknown>, tenantId));
}

function normalizeRow(row: Record<string, unknown>, tenantId: string): DemoRecordRow {
  return Object.entries({
    ...row,
    tenant_id: row['tenant_id'] ?? row['tenantId'] ?? tenantId
  }).reduce<DemoRecordRow>((acc, [key, value]) => {
    acc[key] = String(value ?? '');
    return acc;
  }, {});
}

function extractPayloadField(payload: unknown, key: string): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }
  const row = (payload as Record<string, unknown>)['row'];
  if (!row || typeof row !== 'object') {
    return '';
  }
  return String((row as Record<string, unknown>)[key] ?? '');
}

function getStoreKey(tenantId: string, table: string): string {
  return `${tenantId}:${table}`;
}
