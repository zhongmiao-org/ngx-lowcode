import { NgxLowcodePageSchema } from 'ngx-lowcode-core-types';

export const mockPageSchema: NgxLowcodePageSchema = {
  schemaVersion: '1.0.0',
  pageMeta: {
    id: 'demo-page',
    title: 'Orders Overview',
    description: 'A sample page schema for lowcode hosts.'
  },
  state: {
    keyword: '',
    owner: '',
    channel: 'all',
    status: 'all',
    priority: 'all',
    amount: 0,
    enabled: false,
    radioValue: '选项一',
    switchValue: true,
    selectedDate: null,
    uploadedFiles: [],
    tableData: [
      { id: 'SO-1001', owner: 'Alice', channel: 'web', priority: 'high', status: 'active' },
      { id: 'SO-1002', owner: 'Bob', channel: 'store', priority: 'medium', status: 'paused' }
    ]
  },
  datasources: [
    {
      id: 'orders-datasource',
      type: 'mock',
      responseMapping: {
        stateKey: 'tableData'
      },
      mockData: [
        { id: 'SO-1001', owner: 'Alice', channel: 'web', priority: 'high', status: 'active' },
        { id: 'SO-1002', owner: 'Bob', channel: 'store', priority: 'medium', status: 'paused' }
      ]
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
    }
  ],
  layoutTree: [
    {
      id: 'page-root',
      componentType: 'page',
      props: {
        title: 'Orders Overview',
        description: 'A sample host page driven by PageSchema.',
        thyDirection: 'column',
        thyWrap: 'nowrap',
        thyGap: 20,
        thyJustifyContent: 'start',
        thyAlignItems: 'stretch'
      },
      children: [
        {
          id: 'search-form',
          componentType: 'form',
          props: {
            title: 'Search Filters',
            thyLayout: 'horizontal'
          },
          children: [
            {
              id: 'search-layout',
              componentType: 'section',
              props: {
                title: 'Query Layout',
                thyDirection: 'row',
                thyWrap: 'wrap',
                thyGap: 16,
                thyJustifyContent: 'flex-start',
                thyAlignItems: 'stretch',
                thyBasis: '100%'
              },
              children: [
                {
                  id: 'input-keyword',
                  componentType: 'input',
                  props: {
                    label: 'Keyword',
                    placeholder: 'Search order id or owner',
                    stateKey: 'keyword',
                    thyBasis: 'calc(25% - 12px)'
                  }
                },
                {
                  id: 'input-owner',
                  componentType: 'input',
                  props: {
                    label: 'Owner',
                    placeholder: 'Owner name',
                    stateKey: 'owner',
                    thyBasis: 'calc(25% - 12px)'
                  }
                },
                {
                  id: 'select-status',
                  componentType: 'select',
                  props: {
                    label: 'Status',
                    placeholder: 'Choose a status',
                    stateKey: 'status',
                    thyBasis: 'calc(25% - 12px)',
                    options: [
                      { label: 'All', value: 'all' },
                      { label: 'Active', value: 'active' },
                      { label: 'Paused', value: 'paused' }
                    ]
                  }
                },
                {
                  id: 'select-channel',
                  componentType: 'select',
                  props: {
                    label: 'Channel',
                    placeholder: 'Choose a channel',
                    stateKey: 'channel',
                    thyBasis: 'calc(25% - 12px)',
                    options: [
                      { label: 'All', value: 'all' },
                      { label: 'Web', value: 'web' },
                      { label: 'Store', value: 'store' },
                      { label: 'Partner', value: 'partner' }
                    ]
                  }
                },
                {
                  id: 'select-priority',
                  componentType: 'select',
                  props: {
                    label: 'Priority',
                    placeholder: 'Choose a priority',
                    stateKey: 'priority',
                    thyBasis: 'calc(25% - 12px)',
                    options: [
                      { label: 'All', value: 'all' },
                      { label: 'High', value: 'high' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'Low', value: 'low' }
                    ]
                  }
                },
                {
                  id: 'input-amount',
                  componentType: 'input-number',
                  props: {
                    label: '数量',
                    stateKey: 'amount',
                    value: 0,
                    thyBasis: 'calc(25% - 12px)'
                  }
                },
                {
                  id: 'checkbox-enabled',
                  componentType: 'checkbox',
                  props: {
                    label: '启用筛选',
                    stateKey: 'enabled',
                    thyBasis: 'calc(25% - 12px)'
                  }
                },
                {
                  id: 'radio-approval',
                  componentType: 'radio',
                  props: {
                    label: '审批状态',
                    items: '选项一,选项二,选项三',
                    stateKey: 'radioValue',
                    thyBasis: '100%'
                  }
                },
                {
                  id: 'switch-enable',
                  componentType: 'switch',
                  props: {
                    label: '启用',
                    stateKey: 'switchValue',
                    thyBasis: 'calc(25% - 12px)'
                  }
                },
                {
                  id: 'date-selected',
                  componentType: 'date-picker',
                  props: {
                    label: '日期',
                    stateKey: 'selectedDate',
                    thyBasis: 'calc(25% - 12px)'
                  }
                },
                {
                  id: 'upload-files',
                  componentType: 'upload',
                  props: {
                    label: '附件',
                    stateKey: 'uploadedFiles',
                    thyBasis: '100%'
                  }
                }
              ]
            },
            {
              id: 'search-actions',
              componentType: 'section',
              props: {
                title: 'Query Actions',
                thyDirection: 'row',
                thyWrap: 'wrap',
                thyGap: 12,
                thyJustifyContent: 'flex-start',
                thyAlignItems: 'stretch',
                thyBasis: '100%'
              },
              children: [
                {
                  id: 'button-search',
                  componentType: 'button',
                  props: {
                    label: 'Search',
                    buttonType: 'primary',
                    actionId: 'search-action'
                  }
                },
                {
                  id: 'button-reset',
                  componentType: 'button',
                  props: {
                    label: 'Reset',
                    buttonType: 'default'
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'results-table',
          componentType: 'table',
          props: {
            title: 'Order Results',
            dataKey: 'tableData',
            thyBasis: '100%'
          }
        }
      ]
    }
  ]
};
