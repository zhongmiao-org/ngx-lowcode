import { NgxLowcodeNodeSchema, NgxLowcodePageSchema } from '@zhongmiao/ngx-lowcode-core-types';

const orderRows = [
  { id: 'SO-1001', owner: 'Alice', channel: 'web', priority: 'high', status: 'active' },
  { id: 'SO-1002', owner: 'Bob', channel: 'store', priority: 'medium', status: 'paused' },
  { id: 'SO-1003', owner: 'Chen', channel: 'partner', priority: 'low', status: 'active' }
];

export function createDemoPageSchema(title = 'Orders Overview'): NgxLowcodePageSchema {
  return {
    schemaVersion: '1.0.0',
    pageMeta: {
      id: 'ngx-lowcode-demo-page',
      title,
      description: 'A minimal schema used by the local ngx-lowcode demo app.'
    },
    state: {
      tenantId: 'tenant-a',
      userId: 'tenant-a-user',
      roles: ['USER'],
      keyword: '',
      tableData: orderRows
    },
    datasources: [
      {
        id: 'orders-datasource',
        type: 'middleware-command',
        command: {
          transport: 'http',
          name: 'searchOrders',
          target: 'orders.search',
          timeoutMs: 10000
        },
        request: {
          params: {
            table: 'orders',
            fields: ['id', 'owner', 'channel', 'priority', 'status'],
            filterStateKeys: {
              keyword: 'keyword'
            }
          }
        },
        responseMapping: {
          stateKey: 'tableData'
        },
        mockData: orderRows
      }
    ],
    actions: [
      {
        id: 'search-action',
        steps: [
          {
            type: 'callDatasource',
            datasourceId: 'orders-datasource',
            stateKey: 'tableData'
          }
        ]
      },
      {
        id: 'row-message-action',
        steps: [
          {
            type: 'message',
            message: 'row clicked'
          }
        ]
      }
    ],
    layoutTree: [createDemoRootNode()]
  };
}

export function createSingleMaterialPreviewSchema(node: NgxLowcodeNodeSchema): NgxLowcodePageSchema {
  return {
    ...createDemoPageSchema(`${node.componentType} preview`),
    layoutTree: [
      {
        id: 'material-preview-root',
        componentType: 'page',
        props: {
          title: 'Material Preview',
          description: 'Selected material rendered through the runtime renderer.'
        },
        children: [node]
      }
    ]
  };
}

export function clonePageSchema(schema: NgxLowcodePageSchema): NgxLowcodePageSchema {
  return structuredClone(schema);
}

function createDemoRootNode(): NgxLowcodeNodeSchema {
  return {
    id: 'page-root',
    componentType: 'page',
    props: {
      title: 'Orders Overview',
      description: 'Search data with local mock managers or the online BFF adapter.'
    },
    children: [
      {
        id: 'filter-section',
        componentType: 'section',
        props: {
          title: 'Filters',
          thyDirection: 'row',
          thyWrap: 'wrap',
          thyGap: 16,
          thyAlignItems: 'end'
        },
        children: [
          {
            id: 'keyword-input',
            componentType: 'input',
            props: {
              label: 'Keyword',
              placeholder: 'Search order id or owner',
              stateKey: 'keyword',
              thyBasis: '320px'
            }
          },
          {
            id: 'search-button',
            componentType: 'button',
            props: {
              label: 'Search',
              buttonType: 'primary',
              actionId: 'search-action'
            }
          }
        ]
      },
      {
        id: 'orders-table',
        componentType: 'table',
        props: {
          title: 'Orders',
          dataKey: 'tableData',
          rowClickActionId: 'row-message-action'
        }
      }
    ]
  };
}
