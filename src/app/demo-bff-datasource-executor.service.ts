import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  NgxLowcodeDatasourceDefinition,
  NgxLowcodeDatasourceExecutor,
  NgxLowcodeDatasourceRequest
} from 'ngx-lowcode-core-types';

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

interface DemoOrderRow {
  id: string;
  owner: string;
  channel: string;
  priority: string;
  status: string;
  tenant_id: string;
}

type DemoQuerySource = 'bff' | 'fallback';
type DemoQueryStatus = 'success' | 'fallback' | 'error';

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
  private readonly tenantStores = new Map<string, DemoOrderRow[]>();

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
    switch (datasource.id) {
      case 'orders-create-datasource':
        return this.createOrder(state);
      case 'orders-update-datasource':
        return this.updateOrder(state);
      case 'orders-delete-datasource':
        return this.deleteOrder(state);
      case 'extract-row-id-datasource':
        return extractPayloadField(payload, 'id');
      case 'extract-row-owner-datasource':
        return extractPayloadField(payload, 'owner');
      case 'extract-row-channel-datasource':
        return extractPayloadField(payload, 'channel');
      case 'extract-row-priority-datasource':
        return extractPayloadField(payload, 'priority');
      case 'extract-row-status-datasource':
        return extractPayloadField(payload, 'status');
      default:
        return this.queryOrders(datasource, state);
    }
  };

  private async queryOrders(
    datasource: NgxLowcodeDatasourceDefinition,
    state: Record<string, unknown>
  ): Promise<DemoOrderRow[]> {
    const endpoint = resolveEndpoint(datasource);
    const payload = toQueryPayload(datasource, state);
    const requestId = crypto.randomUUID();
    const store = this.getTenantStore(payload.tenantId, datasource);

    try {
      const response = await firstValueFrom(
        this.http.post<DemoQueryResponse>(endpoint, payload, {
          headers: {
            'x-request-id': requestId
          }
        })
      );
      const rows = normalizeRows(response.rows, payload.tenantId);
      if (rows.length > 0) {
        this.tenantStores.set(payload.tenantId, rows);
      }
      const filteredRows = filterRows(this.tenantStores.get(payload.tenantId) ?? rows, state, payload.tenantId);
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
        console.warn('[demo] bff unavailable, fallback to mockData', error);
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

  private createOrder(state: Record<string, unknown>): DemoOrderRow[] {
    const tenantId = String(state['tenantId'] ?? 'tenant-a');
    const store = [...this.getTenantStore(tenantId)];
    const row = toEditorRow(state, tenantId);
    if (!row) {
      return filterRows(store, state, tenantId);
    }

    const next = store.filter((item) => item.id !== row.id);
    next.unshift(row);
    this.tenantStores.set(tenantId, next);
    this.recordExecution({
      requestId: 'local-create',
      source: 'fallback',
      status: 'success',
      tenantId,
      rowCount: next.length,
      message: `created ${row.id}`
    });
    return filterRows(next, state, tenantId);
  }

  private updateOrder(state: Record<string, unknown>): DemoOrderRow[] {
    const tenantId = String(state['tenantId'] ?? 'tenant-a');
    const store = [...this.getTenantStore(tenantId)];
    const row = toEditorRow(state, tenantId);
    if (!row) {
      return filterRows(store, state, tenantId);
    }

    const index = store.findIndex((item) => item.id === row.id);
    if (index >= 0) {
      store[index] = row;
    } else {
      store.unshift(row);
    }
    this.tenantStores.set(tenantId, store);
    this.recordExecution({
      requestId: 'local-update',
      source: 'fallback',
      status: 'success',
      tenantId,
      rowCount: store.length,
      message: `updated ${row.id}`
    });
    return filterRows(store, state, tenantId);
  }

  private deleteOrder(state: Record<string, unknown>): DemoOrderRow[] {
    const tenantId = String(state['tenantId'] ?? 'tenant-a');
    const targetId = String(state['formOrderId'] ?? state['selectedOrderId'] ?? '').trim();
    const store = [...this.getTenantStore(tenantId)];
    if (!targetId) {
      return filterRows(store, state, tenantId);
    }

    const next = store.filter((item) => item.id !== targetId);
    this.tenantStores.set(tenantId, next);
    this.recordExecution({
      requestId: 'local-delete',
      source: 'fallback',
      status: 'success',
      tenantId,
      rowCount: next.length,
      message: `deleted ${targetId}`
    });
    return filterRows(next, state, tenantId);
  }

  private getTenantStore(tenantId: string, datasource?: NgxLowcodeDatasourceDefinition): DemoOrderRow[] {
    const existing = this.tenantStores.get(tenantId);
    if (existing) {
      return existing;
    }

    const seedRows =
      datasource?.mockData && Array.isArray(datasource.mockData)
        ? normalizeRows(datasource.mockData, tenantId)
        : createTenantSeedRows(tenantId);
    this.tenantStores.set(tenantId, seedRows);
    return seedRows;
  }

  private recordExecution(execution: Omit<DemoQueryExecutionSnapshot, 'happenedAt'>): void {
    this.lastExecution.set({
      ...execution,
      happenedAt: new Date().toISOString()
    });
  }
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

function toQueryPayload(
  datasource: NgxLowcodeDatasourceDefinition,
  state: Record<string, unknown>
): DemoQueryRequest {
  const tenantId = String(state['tenantId'] ?? 'tenant-a');
  const userId = String(state['userId'] ?? `${tenantId}-user`);
  const roles = normalizeRoles(state['roles']);

  const table = resolveTable(datasource);
  const fields = resolveFields(datasource);
  const filters = resolveFilters(state);

  return {
    table,
    fields,
    filters,
    tenantId,
    userId,
    roles,
    limit: 100
  };
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
  return ['id', 'owner', 'channel', 'priority', 'status'];
}

function resolveFilters(state: Record<string, unknown>): Record<string, string | number | boolean> {
  const filters: Record<string, string | number | boolean> = {};
  const appendIfValid = (key: string): void => {
    const value = state[key];
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (!normalized || normalized === 'all') {
        return;
      }
      filters[key] = normalized;
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      filters[key] = value;
    }
  };

  appendIfValid('keyword');
  appendIfValid('owner');
  appendIfValid('channel');
  appendIfValid('priority');
  appendIfValid('status');

  return filters;
}

function normalizeRoles(input: unknown): string[] {
  if (Array.isArray(input) && input.every((item) => typeof item === 'string')) {
    return input.length > 0 ? input : ['USER'];
  }
  return ['USER'];
}

function shouldFallback(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }
  return [0, 502, 503, 504].includes(error.status);
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

function filterRows(rows: DemoOrderRow[], state: Record<string, unknown>, tenantId: string): DemoOrderRow[] {
  const keyword = String(state['keyword'] ?? '').toLowerCase().trim();
  const owner = String(state['owner'] ?? '').toLowerCase().trim();
  const channel = String(state['channel'] ?? 'all');
  const priority = String(state['priority'] ?? 'all');
  const status = String(state['status'] ?? 'all');

  return rows.filter((row) => {
    const rowTenant = String(row.tenant_id ?? '');
    const tenantMatched = !rowTenant || rowTenant === tenantId;
    const keywordMatched =
      !keyword ||
      Object.values(row)
        .map((value) => String(value).toLowerCase())
        .some((value) => value.includes(keyword));
    const ownerMatched = !owner || String(row.owner).toLowerCase().includes(owner);
    const statusMatched = status === 'all' || String(row.status) === status;
    const channelMatched = channel === 'all' || String(row.channel) === channel;
    const priorityMatched = priority === 'all' || String(row.priority) === priority;
    return tenantMatched && keywordMatched && ownerMatched && statusMatched && channelMatched && priorityMatched;
  });
}

function normalizeRows(input: unknown, tenantId: string): DemoOrderRow[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => normalizeRow(item as Record<string, unknown>, tenantId));
}

function normalizeRow(row: Record<string, unknown>, tenantId: string): DemoOrderRow {
  return {
    id: String(row['id'] ?? ''),
    owner: String(row['owner'] ?? ''),
    channel: String(row['channel'] ?? 'web'),
    priority: String(row['priority'] ?? 'medium'),
    status: String(row['status'] ?? 'active'),
    tenant_id: String(row['tenant_id'] ?? row['tenantId'] ?? tenantId)
  };
}

function toEditorRow(state: Record<string, unknown>, tenantId: string): DemoOrderRow | null {
  const id = String(state['formOrderId'] ?? '').trim();
  if (!id) {
    return null;
  }
  return {
    id,
    owner: String(state['formOwner'] ?? '').trim(),
    channel: String(state['formChannel'] ?? 'web'),
    priority: String(state['formPriority'] ?? 'medium'),
    status: String(state['formStatus'] ?? 'active'),
    tenant_id: tenantId
  };
}

function extractPayloadField(payload: unknown, key: keyof DemoOrderRow): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }
  const row = (payload as Record<string, unknown>)['row'];
  if (!row || typeof row !== 'object') {
    return '';
  }
  return String((row as Record<string, unknown>)[key] ?? '');
}

function createTenantSeedRows(tenantId: string): DemoOrderRow[] {
  if (tenantId === 'tenant-b') {
    return [
      {
        id: 'SO-B1001',
        owner: 'Brenda',
        channel: 'partner',
        priority: 'high',
        status: 'active',
        tenant_id: 'tenant-b'
      },
      {
        id: 'SO-B1002',
        owner: 'Bryan',
        channel: 'web',
        priority: 'low',
        status: 'paused',
        tenant_id: 'tenant-b'
      }
    ];
  }

  return [
    {
      id: 'SO-A1001',
      owner: 'Alice',
      channel: 'web',
      priority: 'high',
      status: 'active',
      tenant_id: 'tenant-a'
    },
    {
      id: 'SO-A1002',
      owner: 'Aria',
      channel: 'store',
      priority: 'medium',
      status: 'paused',
      tenant_id: 'tenant-a'
    }
  ];
}
