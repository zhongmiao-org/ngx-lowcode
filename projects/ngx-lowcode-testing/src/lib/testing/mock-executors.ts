import { NgxLowcodeActionExecutionRequest, NgxLowcodeDatasourceRequest } from '@zhongmiao/ngx-lowcode-core-types';

export async function mockDatasourceExecutor({ datasource, state }: NgxLowcodeDatasourceRequest): Promise<unknown> {
  const rows = Array.isArray(datasource.mockData) ? datasource.mockData : [];
  const keyword = String(state['keyword'] ?? '').toLowerCase();
  const status = String(state['status'] ?? 'all');

  return rows.filter((row) => {
    if (typeof row !== 'object' || row === null) {
      return true;
    }

    const typedRow = row as Record<string, unknown>;
    const matchesKeyword =
      !keyword ||
      Object.values(typedRow)
        .map((value) => String(value).toLowerCase())
        .some((value) => value.includes(keyword));
    const matchesStatus = status === 'all' || String(typedRow['status']) === status;

    return matchesKeyword && matchesStatus;
  });
}

export async function mockActionExecutor({ step }: NgxLowcodeActionExecutionRequest): Promise<void> {
  if (step.type === 'message' && step.message) {
    console.info(`mock-action: ${step.message}`);
  }
}
