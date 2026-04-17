import { Injectable, signal } from '@angular/core';
import { RuntimeBffExecutionSnapshot } from '@zhongmiao/meta-lc-runtime-angular';

type DemoQuerySource = 'bff' | 'fallback';
type DemoQueryStatus = 'success' | 'fallback' | 'error' | 'denied';

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
export class DemoRuntimeExecutionStatusService {
  private currentTenantId = 'tenant-a';

  readonly lastExecution = signal<DemoQueryExecutionSnapshot>({
    requestId: '-',
    source: 'bff',
    status: 'success',
    tenantId: 'tenant-a',
    rowCount: 0,
    message: 'ready',
    happenedAt: new Date().toISOString()
  });

  recordTransport(snapshot: RuntimeBffExecutionSnapshot): void {
    this.lastExecution.set({
      requestId: snapshot.responseRequestId || snapshot.requestId || '-',
      source: 'bff',
      status: toQueryStatus(snapshot.status),
      tenantId: this.currentTenantId,
      rowCount: this.lastExecution().rowCount,
      message: snapshot.message || 'request completed',
      happenedAt: new Date().toISOString()
    });
  }

  recordRequestContext(state: Record<string, unknown>): void {
    const tenantId = state['tenantId'];
    if (typeof tenantId === 'string' && tenantId.trim()) {
      this.currentTenantId = tenantId.trim();
    }
  }

  recordResult(result: unknown): void {
    const current = this.lastExecution();
    this.lastExecution.set({
      ...current,
      rowCount: resolveRowCount(result),
      happenedAt: new Date().toISOString()
    });
  }
}

function toQueryStatus(status: RuntimeBffExecutionSnapshot['status']): DemoQueryStatus {
  if (status === 'success') {
    return 'success';
  }
  if (status === 'denied') {
    return 'denied';
  }
  return 'error';
}

function resolveRowCount(result: unknown): number {
  if (Array.isArray(result)) {
    return result.length;
  }
  if (result && typeof result === 'object') {
    const value = (result as { rowCount?: unknown }).rowCount;
    if (typeof value === 'number') {
      return value;
    }
    return 1;
  }
  return 0;
}
