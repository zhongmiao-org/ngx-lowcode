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
    status: 'all',
    tableData: [
      { id: 'SO-1001', owner: 'Alice', status: 'active' },
      { id: 'SO-1002', owner: 'Bob', status: 'paused' }
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
        { id: 'SO-1001', owner: 'Alice', status: 'active' },
        { id: 'SO-1002', owner: 'Bob', status: 'paused' }
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
        description: 'A sample host page driven by PageSchema.'
      },
      children: [
        {
          id: 'search-form',
          componentType: 'form',
          props: {
            title: 'Search Filters'
          },
          children: [
            {
              id: 'input-keyword',
              componentType: 'input',
              props: {
                label: 'Keyword',
                placeholder: 'Search order id or owner',
                stateKey: 'keyword'
              }
            },
            {
              id: 'select-status',
              componentType: 'select',
              props: {
                label: 'Status',
                placeholder: 'Choose a status',
                stateKey: 'status',
                options: [
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Paused', value: 'paused' }
                ]
              }
            },
            {
              id: 'button-search',
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
          id: 'results-table',
          componentType: 'table',
          props: {
            title: 'Order Results',
            dataKey: 'tableData'
          }
        }
      ]
    }
  ]
};
