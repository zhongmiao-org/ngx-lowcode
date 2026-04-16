import type { NgxLowcodeDatasourceDefinition, NgxLowcodePageSchema } from 'ngx-lowcode-core-types';
import { bindDatasourceToNode, createCrudPageSchema, createDatasourceDraftsFromModel, createQueryPageSchema, type NgxLowcodeDatasourceDraft } from 'ngx-lowcode-datasource';
import { createCommerceModelPreset, type NgxLowcodeMetaModelDraft } from 'ngx-lowcode-meta-model';

const DEMO_SELECTED_ORDER_STATE_KEY = 'selectedOrderId';
const DEMO_ORG_ID_STATE_KEYS = ['orgId', 'form_org_id', 'org_id', 'selectedOrgId'] as const;

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
  const orchestrated = applyDemoOrchestrationConventions(hydrated, draft, tenantId);

  return {
    ...orchestrated,
    pageMeta: {
      ...orchestrated.pageMeta,
      description:
        kind === 'crud'
          ? `Commercial demo workspace for ${draft.tableId} with model-driven CRUD generation.`
          : `Commercial demo workspace for ${draft.tableId} with model-driven query generation.`
    },
    state: {
      ...orchestrated.state,
      tableData: createTenantSeedRows(draft.tableId, tenantId)
    },
    datasources: orchestrated.datasources.map((datasource: NgxLowcodeDatasourceDefinition) =>
      datasource.id === `${draft.tableId}-query-datasource`
        ? {
            ...datasource,
            mockData: [...createTenantSeedRows(draft.tableId, 'tenant-a'), ...createTenantSeedRows(draft.tableId, 'tenant-b')]
          }
        : datasource
    )
  };
}

function applyDemoOrchestrationConventions(
  schema: NgxLowcodePageSchema,
  draft: NgxLowcodeDatasourceDraft,
  tenantId: string
): NgxLowcodePageSchema {
  const selectedStateValue = String(schema.state['selectedRecordId'] ?? '');

  return {
    ...schema,
    state: {
      ...schema.state,
      tenantId,
      userId: `demo-${tenantId}-user`,
      roles: Array.isArray(schema.state['roles']) ? schema.state['roles'] : ['USER'],
      selectedRecordId: selectedStateValue,
      [DEMO_SELECTED_ORDER_STATE_KEY]: selectedStateValue
    },
    datasources: schema.datasources.map((datasource) => withDatasourceOrchestrationConfig(datasource, draft)),
    actions: schema.actions.map((action) => withActionOrchestrationConfig(action)),
    layoutTree: schema.layoutTree.map((node) => withLayoutOrchestrationConfig(node))
  };
}

function withDatasourceOrchestrationConfig(
  datasource: NgxLowcodeDatasourceDefinition,
  draft: NgxLowcodeDatasourceDraft
): NgxLowcodeDatasourceDefinition {
  const queryDatasourceId = `${draft.tableId}-query-datasource`;
  const mutationMatch = datasource.id.match(new RegExp(`^${draft.tableId}-(create|update|delete)-datasource$`));
  if (datasource.id === queryDatasourceId) {
    return {
      ...datasource,
      request: {
        ...datasource.request,
        params: {
          ...datasource.request?.params,
          stateKeys: {
            tenantId: 'tenantId',
            userId: 'userId',
            roles: 'roles'
          },
          filterStatePrefix: 'filter_'
        }
      }
    };
  }

  if (mutationMatch) {
    return {
      ...datasource,
      request: {
        ...datasource.request,
        params: {
          ...datasource.request?.params,
          operation: mutationMatch[1],
          stateKeys: {
            tenantId: 'tenantId',
            userId: 'userId',
            roles: 'roles',
            selectedRecordId: DEMO_SELECTED_ORDER_STATE_KEY
          },
          orgIdStateKeys: [...DEMO_ORG_ID_STATE_KEYS]
        }
      }
    };
  }

  return datasource;
}

function withActionOrchestrationConfig(action: NgxLowcodePageSchema['actions'][number]): NgxLowcodePageSchema['actions'][number] {
  if (action.id === 'select-row-action') {
    return {
      ...action,
      steps: action.steps.map((step) =>
        step.type === 'callDatasource' && step.stateKey === 'selectedRecordId'
          ? {
              ...step,
              stateKey: DEMO_SELECTED_ORDER_STATE_KEY
            }
          : step
      )
    };
  }

  if (action.id === 'clear-editor-action') {
    return {
      ...action,
      steps: action.steps.map((step) =>
        step.type === 'setState' && step.patch
          ? {
              ...step,
              patch: {
                ...step.patch,
                [DEMO_SELECTED_ORDER_STATE_KEY]: '',
                selectedRecordId: ''
              }
            }
          : step
      )
    };
  }

  return action;
}

function withLayoutOrchestrationConfig(node: NgxLowcodePageSchema['layoutTree'][number]): NgxLowcodePageSchema['layoutTree'][number] {
  const currentText = typeof node.props['text'] === 'string' ? node.props['text'] : null;
  const patchedText =
    node.id === 'crud-hint' && currentText
      ? currentText.replace(/selectedRecordId/g, DEMO_SELECTED_ORDER_STATE_KEY)
      : currentText;

  return {
    ...node,
    props:
      patchedText === null
        ? node.props
        : {
            ...node.props,
            text: patchedText
          },
    children: node.children?.map((child) => withLayoutOrchestrationConfig(child))
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
