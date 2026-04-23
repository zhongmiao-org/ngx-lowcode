import { NgxLowcodeNodeSchema, NgxLowcodePageSchema } from '@zhongmiao/ngx-lowcode-core-types';

export const demoOrderRows = [
  { id: 'SO-1001', owner: 'Alice', channel: 'web', priority: 'high', status: 'active' },
  { id: 'SO-1002', owner: 'Bob', channel: 'store', priority: 'medium', status: 'paused' },
  { id: 'SO-1003', owner: 'Chen', channel: 'partner', priority: 'low', status: 'active' }
];

export const demoImageDataUrl =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 480 240%22%3E%3Crect width=%22480%22 height=%22240%22 rx=%2216%22 fill=%22%23eef2ff%22/%3E%3Cpath d=%22M72 172l92-92 70 70 38-38 136 136H72z%22 fill=%22%2399a8ff%22/%3E%3Ccircle cx=%22356%22 cy=%2276%22 r=%2232%22 fill=%22%23fbbf24%22/%3E%3Ctext x=%22240%22 y=%22216%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2224%22 fill=%22%23374151%22%3ELocal demo image%3C/text%3E%3C/svg%3E';

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
      tableData: demoOrderRows
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
        mockData: demoOrderRows
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
  const previewNode = withDemoPreviewDefaults(node);

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
        children: [previewNode]
      }
    ]
  };
}

export function createTableDemoPageSchema(tableData = demoOrderRows): NgxLowcodePageSchema {
  return {
    ...createDemoPageSchema('Table Demo'),
    pageMeta: {
      id: 'ngx-lowcode-table-demo-page',
      title: 'Table Demo',
      description: 'A focused table schema with local mock data and runtime actions.'
    },
    state: {
      tenantId: 'tenant-a',
      userId: 'tenant-a-user',
      roles: ['USER'],
      keyword: '',
      tableData
    },
    layoutTree: [
      {
        id: 'table-demo-root',
        componentType: 'page',
        props: {
          title: 'Orders Table',
          description: 'Table material bound to runtime state and datasource actions.'
        },
        children: [
          {
            id: 'table-demo-toolbar',
            componentType: 'section',
            props: {
              title: 'Query',
              thyDirection: 'row',
              thyWrap: 'wrap',
              thyGap: 16,
              thyAlignItems: 'end'
            },
            children: [
              {
                id: 'table-demo-keyword',
                componentType: 'input',
                props: {
                  label: 'Keyword',
                  placeholder: 'Filter order id or owner',
                  stateKey: 'keyword',
                  thyBasis: '320px'
                }
              },
              {
                id: 'table-demo-search',
                componentType: 'button',
                props: {
                  label: 'Run search',
                  buttonType: 'primary',
                  actionId: 'search-action'
                }
              }
            ]
          },
          {
            id: 'table-demo-orders',
            componentType: 'table',
            props: {
              title: 'Orders',
              datasourceId: 'orders-datasource',
              dataKey: 'tableData',
              rowClickActionId: 'row-message-action',
              thyBasis: '100%'
            }
          }
        ]
      }
    ]
  };
}

export function clonePageSchema(schema: NgxLowcodePageSchema): NgxLowcodePageSchema {
  return structuredClone(schema);
}

function withDemoPreviewDefaults(node: NgxLowcodeNodeSchema): NgxLowcodeNodeSchema {
  if (node.componentType !== 'image') {
    return node;
  }

  return {
    ...node,
    props: {
      ...node.props,
      src: demoImageDataUrl
    }
  };
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
