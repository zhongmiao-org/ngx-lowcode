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

  execute: NgxLowcodeDatasourceExecutor = async ({ datasource, state }: NgxLowcodeDatasourceRequest) => {
    const endpoint = resolveEndpoint(datasource);
    const payload = toQueryPayload(datasource, state);
    const requestId = crypto.randomUUID();

    try {
      const response = await firstValueFrom(
        this.http.post<DemoQueryResponse>(endpoint, payload, {
          headers: {
            'x-request-id': requestId
          }
        })
      );
      const rows = Array.isArray(response.rows) ? response.rows : [];
      this.recordExecution({
        requestId,
        source: 'bff',
        status: 'success',
        tenantId: payload.tenantId,
        rowCount: rows.length,
        message: 'query succeeded'
      });
      return rows;
    } catch (error) {
      if (shouldFallback(error)) {
        console.warn('[demo] bff unavailable, fallback to mockData', error);
        const rows = fallbackMockRows(datasource, state);
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
  };

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

function fallbackMockRows(
  datasource: NgxLowcodeDatasourceDefinition,
  state: Record<string, unknown>
): Record<string, unknown>[] {
  const rows = Array.isArray(datasource.mockData) ? datasource.mockData : [];
  const tenantId = String(state['tenantId'] ?? 'tenant-a');
  const keyword = String(state['keyword'] ?? '').toLowerCase().trim();
  const status = String(state['status'] ?? 'all');

  return rows.filter((row) => {
    if (typeof row !== 'object' || row === null) {
      return false;
    }
    const typed = row as Record<string, unknown>;
    const rowTenant = String(typed['tenant_id'] ?? typed['tenantId'] ?? '');
    const tenantMatched = !rowTenant || rowTenant === tenantId;
    const keywordMatched =
      !keyword ||
      Object.values(typed)
        .map((value) => String(value).toLowerCase())
        .some((value) => value.includes(keyword));
    const statusMatched = status === 'all' || String(typed['status']) === status;
    return tenantMatched && keywordMatched && statusMatched;
  });
}
