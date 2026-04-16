import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  NgxLowcodeDatasourceDefinition,
  NgxLowcodeDatasourceExecutor,
  NgxLowcodeDatasourceRequest
} from '@zhongmiao/ngx-lowcode-core-types';
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
  orgId?: string;
  key?: Record<string, string>;
  data?: Record<string, string>;
}

interface DemoMutationResponse {
  rowCount: number;
  row: unknown | null;
}

interface DemoDatasourceStateKeysConfig {
  tenantId?: string;
  userId?: string;
  roles?: string;
  selectedRecordId?: string;
}

type DemoQuerySource = 'bff' | 'fallback';
type DemoQueryStatus = 'success' | 'fallback' | 'error' | 'denied';
type DemoRecordRow = Record<string, string>;
type DemoPermissionScope = 'SELF' | 'DEPT' | 'DEPT_AND_CHILDREN' | 'CUSTOM_ORG_SET' | 'TENANT_ALL';

interface DemoPermissionDecision {
  allowed: boolean;
  scope: DemoPermissionScope;
  allowedOrgIds: string[];
  targetOrgId: string;
  reason: string;
}

class PermissionDeniedError extends Error {
  readonly status = 403;

  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

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

  execute: NgxLowcodeDatasourceExecutor = async ({ datasource, state, payload }: NgxLowcodeDatasourceRequest) => {
    if (datasource.type === 'local-payload') {
      return extractPayloadField(payload, String(datasource.request?.params?.['field'] ?? 'id'));
    }

    const operation = resolveMutationOperation(datasource);
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
      const filteredRows = filterRows(rows, datasource, state, payload.tenantId);
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
        const rows = filterRows(store, datasource, state, payload.tenantId);
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
    const permissionDecision = evaluateMutationPermission(datasource, state, payload);
    if (!permissionDecision.allowed) {
      const error = new PermissionDeniedError(
        `permission denied: ${permissionDecision.reason} (scope=${permissionDecision.scope}, targetOrgId=${permissionDecision.targetOrgId})`
      );
      this.recordExecution({
        requestId,
        source: 'bff',
        status: 'denied',
        tenantId: payload.tenantId,
        rowCount: 0,
        message: error.message
      });
      throw error;
    }

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
        status: isPermissionDenied(error) ? 'denied' : 'error',
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

function resolveMutationOperation(datasource: NgxLowcodeDatasourceDefinition): DemoMutationRequest['operation'] | null {
  const configured = datasource.request?.params?.['operation'];
  if (configured === 'create' || configured === 'update' || configured === 'delete') {
    return configured;
  }

  if (datasource.id.endsWith('-create-datasource')) {
    return 'create';
  }
  if (datasource.id.endsWith('-update-datasource')) {
    return 'update';
  }
  if (datasource.id.endsWith('-delete-datasource')) {
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
  return 'http://localhost:6000';
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

function toQueryPayload(datasource: NgxLowcodeDatasourceDefinition, state: Record<string, unknown>): DemoQueryRequest {
  const stateKeys = resolveStateKeysConfig(datasource);
  const tenantId = String(state[stateKeys.tenantId] ?? 'tenant-a');
  const userId = String(state[stateKeys.userId] ?? `${tenantId}-user`);
  const roles = normalizeRoles(state[stateKeys.roles]);
  const permissionScope = resolvePermissionScope(datasource);
  const selectedOrgId = resolveOrgId(datasource, state, tenantId);
  const customOrgIds = resolveCustomOrgIds(datasource);
  const allowedOrgIds = resolveAllowedOrgIds(permissionScope, selectedOrgId, customOrgIds, tenantId, roles);

  return {
    table: resolveTable(datasource),
    fields: resolveFields(datasource),
    filters: resolveFilters(datasource, state, {
      permissionScope,
      selectedOrgId,
      allowedOrgIds
    }),
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
  const stateKeys = resolveStateKeysConfig(datasource);
  const tenantId = String(state[stateKeys.tenantId] ?? 'tenant-a');
  const userId = String(state[stateKeys.userId] ?? `${tenantId}-user`);
  const roles = normalizeRoles(state[stateKeys.roles]);
  const table = resolveTable(datasource);
  const keyField = String(datasource.request?.params?.['keyField'] ?? 'id');
  const fieldStateMap = resolveFieldStateMap(datasource);
  const keyValue = String(
    state[fieldStateMap[keyField] ?? `form_${keyField}`] ?? state[stateKeys.selectedRecordId] ?? ''
  ).trim();
  const orgId = resolveOrgId(datasource, state, tenantId);

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
    orgId,
    key: {
      [keyField]: keyValue
    },
    data
  };
}

function resolveOrgId(
  datasource: NgxLowcodeDatasourceDefinition,
  state: Record<string, unknown>,
  tenantId: string
): string {
  const stateKeys = resolveOrgIdStateKeys(datasource);
  const candidates = stateKeys.map((stateKey) => state[stateKey]);
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return tenantId === 'tenant-b' ? 'dept-c' : 'dept-a';
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

function resolveStateKeysConfig(datasource: NgxLowcodeDatasourceDefinition): Required<DemoDatasourceStateKeysConfig> {
  const raw = datasource.request?.params?.['stateKeys'];
  const normalized =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as DemoDatasourceStateKeysConfig) : {};
  return {
    tenantId: normalized.tenantId?.trim() || 'tenantId',
    userId: normalized.userId?.trim() || 'userId',
    roles: normalized.roles?.trim() || 'roles',
    selectedRecordId: normalized.selectedRecordId?.trim() || 'selectedRecordId'
  };
}

function resolveOrgIdStateKeys(datasource: NgxLowcodeDatasourceDefinition): string[] {
  const raw = datasource.request?.params?.['orgIdStateKeys'];
  if (Array.isArray(raw) && raw.every((item) => typeof item === 'string' && item.trim())) {
    return raw.map((item) => item.trim());
  }
  return ['orgId', 'form_org_id', 'org_id', 'selectedOrgId'];
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

function resolveFilters(
  datasource: NgxLowcodeDatasourceDefinition,
  state: Record<string, unknown>,
  orgScope?: {
    permissionScope: DemoPermissionScope;
    selectedOrgId: string;
    allowedOrgIds: string[];
  }
): Record<string, string | number | boolean> {
  const filters: Record<string, string | number | boolean> = {};
  const prefix = resolveFilterStatePrefix(datasource);
  const explicitFilterStateKeys = resolveFilterStateKeys(datasource);

  explicitFilterStateKeys.forEach((stateKey, filterKey) => {
    appendFilter(filters, filterKey, state[stateKey]);
  });

  Object.entries(state).forEach(([key, value]) => {
    if (!key.startsWith(prefix)) {
      return;
    }
    appendFilter(filters, key.slice(prefix.length), value);
  });

  ['keyword', 'owner', 'channel', 'priority', 'status', 'org_id'].forEach((legacyKey) => {
    appendFilter(filters, legacyKey, state[legacyKey]);
  });

  if (orgScope && orgScope.permissionScope !== 'TENANT_ALL') {
    if (orgScope.selectedOrgId) {
      filters['org_id'] = orgScope.selectedOrgId;
    }
    if (orgScope.allowedOrgIds.length > 0) {
      filters['org_scope'] = orgScope.permissionScope;
      filters['org_ids'] = orgScope.allowedOrgIds.join(',');
    }
  }

  return filters;
}

function resolveFilterStatePrefix(datasource: NgxLowcodeDatasourceDefinition): string {
  const raw = datasource.request?.params?.['filterStatePrefix'];
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return 'filter_';
}

function resolveFilterStateKeys(datasource: NgxLowcodeDatasourceDefinition): Map<string, string> {
  const raw = datasource.request?.params?.['filterStateKeys'];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return new Map();
  }
  return new Map(
    Object.entries(raw as Record<string, unknown>)
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([filterKey, stateKey]) => [filterKey, String(stateKey).trim()])
  );
}

function appendFilter(target: Record<string, string | number | boolean>, key: string, value: unknown): void {
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
  if (isPermissionDenied(error)) {
    return error.message;
  }
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

function resolvePermissionScope(datasource: NgxLowcodeDatasourceDefinition): DemoPermissionScope {
  const raw = datasource.request?.params?.['permissionScope'];
  if (
    raw === 'SELF' ||
    raw === 'DEPT' ||
    raw === 'DEPT_AND_CHILDREN' ||
    raw === 'CUSTOM_ORG_SET' ||
    raw === 'TENANT_ALL'
  ) {
    return raw;
  }
  return 'DEPT';
}

function resolveCustomOrgIds(datasource: NgxLowcodeDatasourceDefinition): string[] {
  const raw = datasource.request?.params?.['customOrgIds'];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((item) => String(item).trim()).filter((item) => item.length > 0);
}

function resolveAllowedOrgIds(
  scope: DemoPermissionScope,
  selectedOrgId: string,
  customOrgIds: string[],
  tenantId: string,
  roles: string[]
): string[] {
  if (scope === 'TENANT_ALL' || roles.includes('SUPER_ADMIN')) {
    return [];
  }
  if (scope === 'CUSTOM_ORG_SET') {
    return customOrgIds;
  }

  const baseOrgId = selectedOrgId || defaultTenantOrgId(tenantId);
  if (scope === 'DEPT_AND_CHILDREN') {
    return [baseOrgId, ...resolveOrgChildren(tenantId, baseOrgId)];
  }
  return [baseOrgId];
}

function evaluateMutationPermission(
  datasource: NgxLowcodeDatasourceDefinition,
  state: Record<string, unknown>,
  payload: DemoMutationRequest
): DemoPermissionDecision {
  const scope = resolvePermissionScope(datasource);
  const customOrgIds = resolveCustomOrgIds(datasource);
  const selectedOrgId =
    (typeof state['selectedOrgId'] === 'string' && state['selectedOrgId'].trim()) ||
    resolveOrgId(datasource, state, payload.tenantId);
  const allowedOrgIds = resolveAllowedOrgIds(scope, selectedOrgId, customOrgIds, payload.tenantId, payload.roles);
  const targetOrgId = (payload.orgId?.trim() || resolveOrgId(datasource, state, payload.tenantId)).trim();

  if (scope === 'TENANT_ALL' || payload.roles.includes('SUPER_ADMIN')) {
    return {
      allowed: true,
      scope,
      allowedOrgIds,
      targetOrgId,
      reason: 'scope-tenant-all'
    };
  }

  if (allowedOrgIds.includes(targetOrgId)) {
    return {
      allowed: true,
      scope,
      allowedOrgIds,
      targetOrgId,
      reason: 'org-allowed'
    };
  }

  return {
    allowed: false,
    scope,
    allowedOrgIds,
    targetOrgId,
    reason: 'org-out-of-scope'
  };
}

function resolveOrgChildren(tenantId: string, orgId: string): string[] {
  const tree =
    tenantId === 'tenant-b'
      ? {
          'dept-c': ['dept-c-1', 'dept-c-2']
        }
      : {
          'dept-a': ['dept-a-1', 'dept-a-2'],
          'dept-b': ['dept-b-1']
        };
  return tree[orgId as keyof typeof tree] ?? [];
}

function defaultTenantOrgId(tenantId: string): string {
  return tenantId === 'tenant-b' ? 'dept-c' : 'dept-a';
}

function isPermissionDenied(error: unknown): error is PermissionDeniedError {
  return error instanceof PermissionDeniedError;
}

function filterRows(
  rows: DemoRecordRow[],
  datasource: NgxLowcodeDatasourceDefinition,
  state: Record<string, unknown>,
  tenantId: string
): DemoRecordRow[] {
  const filters = resolveFilters(datasource, state);

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
        return String(row[key] ?? '')
          .toLowerCase()
          .includes(String(value).toLowerCase());
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
