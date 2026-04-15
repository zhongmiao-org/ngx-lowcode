import type { NgxLowcodeDatasourceDefinition, NgxLowcodePageSchema } from 'ngx-lowcode-core-types';
import { bindDatasourceToNode, createCrudPageSchema, createDatasourceDraftsFromModel, createQueryPageSchema, type NgxLowcodeDatasourceDraft } from 'ngx-lowcode-datasource';
import { createCommerceModelPreset, type NgxLowcodeMetaModelDraft } from 'ngx-lowcode-meta-model';

export function createDemoMetaModelPreset(): NgxLowcodeMetaModelDraft {
  return createCommerceModelPreset();
}

export function createDemoDatasourceDrafts(model: NgxLowcodeMetaModelDraft): NgxLowcodeDatasourceDraft[] {
  return createDatasourceDraftsFromModel(model);
}

export function createOrdersDemoSchema(tenantId: string): NgxLowcodePageSchema {
  const model = createDemoMetaModelPreset();
  const datasource = createDemoDatasourceDrafts(model).find((draft) => draft.tableId === 'orders');
  if (!datasource) {
    throw new Error('Orders datasource draft not found.');
  }
  return createDemoGeneratedSchema(datasource, tenantId, 'crud');
}

export function createDemoGeneratedSchema(
  draft: NgxLowcodeDatasourceDraft,
  tenantId: string,
  kind: 'crud' | 'query'
): NgxLowcodePageSchema {
  const schema =
    kind === 'crud'
      ? createCrudPageSchema(draft, tenantId, {
          pageId: `${draft.tableId}-crud-demo`,
          pageTitle: `${draft.label} CRUD Demo`
        })
      : createQueryPageSchema(draft, tenantId, {
          pageId: `${draft.tableId}-query-demo`,
          pageTitle: `${draft.label} Query Demo`
        });

  const hydrated = bindDatasourceToNode(schema, {
    nodeId: 'results-table',
    datasourceId: `${draft.tableId}-query-datasource`,
    dataKey: 'tableData',
    rowClickActionId: 'select-row-action'
  });

  return {
    ...hydrated,
    pageMeta: {
      ...hydrated.pageMeta,
      description:
        kind === 'crud'
          ? `Commercial demo workspace for ${draft.tableId} with model-driven CRUD generation.`
          : `Commercial demo workspace for ${draft.tableId} with model-driven query generation.`
    },
    state: {
      ...hydrated.state,
      tableData: createTenantSeedRows(draft.tableId, tenantId)
    },
    datasources: hydrated.datasources.map((datasource: NgxLowcodeDatasourceDefinition) =>
      datasource.id === `${draft.tableId}-query-datasource`
        ? {
            ...datasource,
            mockData: [...createTenantSeedRows(draft.tableId, 'tenant-a'), ...createTenantSeedRows(draft.tableId, 'tenant-b')]
          }
        : datasource
    )
  };
}

export function createTenantSeedRows(tableId: string, tenantId: string): Array<Record<string, string>> {
  if (tableId === 'customers') {
    return tenantId === 'tenant-b'
      ? [
          { id: 'CU-B1001', name: 'Beacon Labs', tier: 'gold', tenant_id: 'tenant-b' },
          { id: 'CU-B1002', name: 'Blue Harbor', tier: 'silver', tenant_id: 'tenant-b' }
        ]
      : [
          { id: 'CU-A1001', name: 'Acme Retail', tier: 'platinum', tenant_id: 'tenant-a' },
          { id: 'CU-A1002', name: 'Artemis Foods', tier: 'gold', tenant_id: 'tenant-a' }
        ];
  }

  return tenantId === 'tenant-b'
    ? [
        {
          id: 'SO-B1001',
          owner: 'Brenda',
          channel: 'partner',
          priority: 'high',
          status: 'active',
          customer_id: 'CU-B1001',
          tenant_id: 'tenant-b'
        },
        {
          id: 'SO-B1002',
          owner: 'Bryan',
          channel: 'web',
          priority: 'low',
          status: 'paused',
          customer_id: 'CU-B1002',
          tenant_id: 'tenant-b'
        }
      ]
    : [
        {
          id: 'SO-A1001',
          owner: 'Alice',
          channel: 'web',
          priority: 'high',
          status: 'active',
          customer_id: 'CU-A1001',
          tenant_id: 'tenant-a'
        },
        {
          id: 'SO-A1002',
          owner: 'Aria',
          channel: 'store',
          priority: 'medium',
          status: 'paused',
          customer_id: 'CU-A1002',
          tenant_id: 'tenant-a'
        }
      ];
}
