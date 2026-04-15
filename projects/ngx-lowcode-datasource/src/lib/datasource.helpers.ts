import type { NgxLowcodeActionDefinition, NgxLowcodeDatasourceDefinition, NgxLowcodeNodeSchema, NgxLowcodePageSchema } from 'ngx-lowcode-core-types';
import type { NgxLowcodeMetaColumnDraft, NgxLowcodeMetaModelDraft, NgxLowcodeMetaTableDraft } from 'ngx-lowcode-meta-model';
import type { NgxLowcodeBindingDraft, NgxLowcodeDatasourceDraft, NgxLowcodeDatasourceFieldDraft } from './datasource.types';

export function createDatasourceDraftFromTable(
  table: NgxLowcodeMetaTableDraft,
  columns: NgxLowcodeMetaColumnDraft[],
  endpoint = '/query',
  mutationEndpoint = '/mutation'
): NgxLowcodeDatasourceDraft {
  const fieldDrafts = columns
    .filter((column) => column.name !== 'tenant_id')
    .map<NgxLowcodeDatasourceFieldDraft>((column) => ({
      id: column.id,
      name: column.name,
      label: labelizeField(column.name),
      type: column.type,
      filterable: column.name !== 'id',
      editable: !column.primary,
      searchable: ['id', 'owner', 'name', 'sku', 'status'].includes(column.name)
    }));

  const keyField = columns.find((column) => column.primary)?.name ?? columns[0]?.name ?? 'id';
  return {
    id: `${table.id}-resource`,
    tableId: table.id,
    label: table.label,
    endpoint,
    mutationEndpoint,
    keyField,
    fields: fieldDrafts
  };
}

export function createDatasourceDraftsFromModel(model: NgxLowcodeMetaModelDraft): NgxLowcodeDatasourceDraft[] {
  return model.tables
    .filter((table) => table.kind === 'root')
    .map((table) => createDatasourceDraftFromTable(table, table.columns));
}

export function validateDatasourceDraft(draft: NgxLowcodeDatasourceDraft): string[] {
  const issues: string[] = [];
  if (!draft.id.trim()) {
    issues.push('Datasource id is required.');
  }
  if (!draft.tableId.trim()) {
    issues.push('Datasource table id is required.');
  }
  if (!draft.keyField.trim()) {
    issues.push('Datasource key field is required.');
  }
  if (draft.fields.length === 0) {
    issues.push('Datasource requires at least one field.');
  }
  const names = new Set<string>();
  draft.fields.forEach((field) => {
    if (names.has(field.name)) {
      issues.push(`Duplicate datasource field "${field.name}".`);
    }
    names.add(field.name);
  });
  return issues;
}

export function createRestQueryDatasourceDefinition(draft: NgxLowcodeDatasourceDraft): NgxLowcodeDatasourceDefinition {
  return {
    id: `${draft.tableId}-query-datasource`,
    type: 'rest',
    request: {
      method: 'POST',
      url: draft.endpoint,
      params: {
        table: draft.tableId,
        fields: draft.fields.map((field) => field.name)
      }
    },
    responseMapping: {
      stateKey: 'tableData'
    }
  };
}

export function createRestMutationDatasourceDefinitions(draft: NgxLowcodeDatasourceDraft): NgxLowcodeDatasourceDefinition[] {
  const fieldStateMap = draft.fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.name] = `form_${field.name}`;
    return acc;
  }, {});

  return ['create', 'update', 'delete'].map<NgxLowcodeDatasourceDefinition>((operation) => ({
    id: `${draft.tableId}-${operation}-datasource`,
    type: 'rest',
    request: {
      method: 'POST',
      url: draft.mutationEndpoint,
      params: {
        table: draft.tableId,
        keyField: draft.keyField,
        fieldStateMap
      }
    }
  }));
}

export function createQueryPageSchema(
  draft: NgxLowcodeDatasourceDraft,
  tenantId: string,
  options: { pageId?: string; pageTitle?: string } = {}
): NgxLowcodePageSchema {
  const queryDatasource = createRestQueryDatasourceDefinition(draft);
  const actions = createSharedActions(draft, false);

  return {
    schemaVersion: '1.0.0',
    pageMeta: {
      id: options.pageId ?? `${draft.tableId}-query-page`,
      title: options.pageTitle ?? `${draft.label} Query Workspace`,
      description: `Generated query page for ${draft.tableId}.`
    },
    state: createInitialState(draft, tenantId),
    datasources: [queryDatasource],
    actions,
    layoutTree: createQueryLayoutTree(draft)
  };
}

export function createCrudPageSchema(
  draft: NgxLowcodeDatasourceDraft,
  tenantId: string,
  options: { pageId?: string; pageTitle?: string } = {}
): NgxLowcodePageSchema {
  const queryDatasource = createRestQueryDatasourceDefinition(draft);
  const mutationDatasources = createRestMutationDatasourceDefinitions(draft);
  const extractDatasources = draft.fields.map<NgxLowcodeDatasourceDefinition>((field) => ({
    id: `${draft.tableId}-extract-${field.name}-datasource`,
    type: 'local-payload',
    request: {
      params: {
        field: field.name
      }
    }
  }));

  return {
    schemaVersion: '1.0.0',
    pageMeta: {
      id: options.pageId ?? `${draft.tableId}-crud-page`,
      title: options.pageTitle ?? `${draft.label} CRUD Workspace`,
      description: `Generated CRUD page for ${draft.tableId}.`
    },
    state: createInitialState(draft, tenantId),
    datasources: [queryDatasource, ...mutationDatasources, ...extractDatasources],
    actions: createSharedActions(draft, true),
    layoutTree: createCrudLayoutTree(draft)
  };
}

export function bindDatasourceToNode(schema: NgxLowcodePageSchema, binding: NgxLowcodeBindingDraft): NgxLowcodePageSchema {
  return {
    ...schema,
    layoutTree: schema.layoutTree.map((node) => bindNode(node, binding))
  };
}

export function labelizeField(fieldName: string): string {
  return fieldName
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (segment) => segment.toUpperCase());
}

function createInitialState(draft: NgxLowcodeDatasourceDraft, tenantId: string): Record<string, unknown> {
  const fieldState = draft.fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[`filter_${field.name}`] = '';
    acc[`form_${field.name}`] = field.name === draft.keyField ? '' : '';
    return acc;
  }, {});

  return {
    ...fieldState,
    tableData: [],
    tenantId,
    userId: `demo-${tenantId}-user`,
    roles: ['USER'],
    selectedRecordId: '',
    formMode: 'idle'
  };
}

function createSharedActions(draft: NgxLowcodeDatasourceDraft, includeCrud: boolean): NgxLowcodeActionDefinition[] {
  const queryDatasourceId = `${draft.tableId}-query-datasource`;
  const actions: NgxLowcodeActionDefinition[] = [
    {
      id: 'search-action',
      steps: [
        {
          type: 'callDatasource',
          datasourceId: queryDatasourceId,
          stateKey: 'tableData'
        }
      ]
    },
    {
      id: 'reset-filters-action',
      steps: [
        {
          type: 'setState',
          patch: draft.fields.reduce<Record<string, string>>((acc, field) => {
            acc[`filter_${field.name}`] = '';
            return acc;
          }, {})
        },
        {
          type: 'callDatasource',
          datasourceId: queryDatasourceId,
          stateKey: 'tableData'
        }
      ]
    }
  ];

  if (!includeCrud) {
    return actions;
  }

  const keyFieldState = `form_${draft.keyField}`;
  const extractSteps = draft.fields.map((field) => ({
    type: 'callDatasource' as const,
    datasourceId: `${draft.tableId}-extract-${field.name}-datasource`,
    stateKey: `form_${field.name}`
  }));

  return [
    ...actions,
    {
      id: 'create-record-action',
      steps: [
        { type: 'callDatasource', datasourceId: `${draft.tableId}-create-datasource` },
        { type: 'callDatasource', datasourceId: queryDatasourceId, stateKey: 'tableData' },
        { type: 'setState', patch: { formMode: 'created' } }
      ]
    },
    {
      id: 'update-record-action',
      steps: [
        { type: 'callDatasource', datasourceId: `${draft.tableId}-update-datasource` },
        { type: 'callDatasource', datasourceId: queryDatasourceId, stateKey: 'tableData' },
        { type: 'setState', patch: { formMode: 'updated' } }
      ]
    },
    {
      id: 'delete-record-action',
      steps: [
        { type: 'callDatasource', datasourceId: `${draft.tableId}-delete-datasource` },
        { type: 'callDatasource', datasourceId: queryDatasourceId, stateKey: 'tableData' },
        { type: 'setState', patch: { formMode: 'deleted' } }
      ]
    },
    {
      id: 'select-row-action',
      steps: [
        {
          type: 'callDatasource',
          datasourceId: `${draft.tableId}-extract-${draft.keyField}-datasource`,
          stateKey: 'selectedRecordId'
        },
        {
          type: 'callDatasource',
          datasourceId: `${draft.tableId}-extract-${draft.keyField}-datasource`,
          stateKey: keyFieldState
        },
        ...extractSteps.filter((step) => step.stateKey !== keyFieldState),
        { type: 'setState', patch: { formMode: 'editing' } }
      ]
    },
    {
      id: 'clear-editor-action',
      steps: [
        {
          type: 'setState',
          patch: {
            selectedRecordId: '',
            formMode: 'idle',
            ...draft.fields.reduce<Record<string, string>>((acc, field) => {
              acc[`form_${field.name}`] = '';
              return acc;
            }, {})
          }
        }
      ]
    }
  ];
}

function createQueryLayoutTree(draft: NgxLowcodeDatasourceDraft): NgxLowcodeNodeSchema[] {
  const filterFields = draft.fields.filter((field) => field.filterable).slice(0, 4);

  return [
    {
      id: `${draft.tableId}-page-root`,
      componentType: 'page',
      props: {
        title: `${draft.label} Query Workspace`,
        description: `Generated query page for ${draft.label}.`,
        thyDirection: 'column',
        thyWrap: 'nowrap',
        thyGap: 20,
        thyJustifyContent: 'start',
        thyAlignItems: 'stretch'
      },
      children: [
        {
          id: 'query-form',
          componentType: 'form',
          props: {
            title: 'Query Filters',
            thyLayout: 'horizontal'
          },
          children: [
            {
              id: 'query-filter-layout',
              componentType: 'section',
              props: {
                title: 'Filter Inputs',
                thyDirection: 'row',
                thyWrap: 'wrap',
                thyGap: 16,
                thyBasis: '100%'
              },
              children: filterFields.map((field) => ({
                id: `filter-${field.name}`,
                componentType: 'input',
                props: {
                  label: field.label,
                  placeholder: `Filter by ${field.label}`,
                  stateKey: `filter_${field.name}`,
                  thyBasis: 'calc(25% - 12px)'
                }
              }))
            },
            {
              id: 'query-actions',
              componentType: 'section',
              props: {
                title: 'Query Actions',
                thyDirection: 'row',
                thyWrap: 'wrap',
                thyGap: 12,
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
                    label: 'Reset Filters',
                    buttonType: 'default',
                    actionId: 'reset-filters-action'
                  }
                }
              ]
            }
          ]
        },
        createResultsTableNode(draft)
      ]
    }
  ];
}

function createCrudLayoutTree(draft: NgxLowcodeDatasourceDraft): NgxLowcodeNodeSchema[] {
  const queryTree = createQueryLayoutTree(draft);
  const editableFields = draft.fields.slice(0, 5);
  const root = queryTree[0];
  if (!root) {
    return [];
  }

  return [
    {
      ...root,
      props: {
        ...root.props,
        title: `${draft.label} CRUD Workspace`,
        description: `Generated CRUD page for ${draft.label}.`
      },
      children: [
        ...(root.children ?? []),
        {
          id: 'crud-form',
          componentType: 'form',
          props: {
            title: `${draft.label} Editor`,
            thyLayout: 'horizontal'
          },
          children: [
            {
              id: 'crud-hint',
              componentType: 'text',
              props: {
                text: 'Selected record: {{ state.selectedRecordId || "none" }} | Mode: {{ state.formMode }}'
              }
            },
            {
              id: 'crud-input-layout',
              componentType: 'section',
              props: {
                title: 'Editor Fields',
                thyDirection: 'row',
                thyWrap: 'wrap',
                thyGap: 16,
                thyBasis: '100%'
              },
              children: editableFields.map((field) => ({
                id: `editor-${field.name}`,
                componentType: 'input',
                props: {
                  label: field.label,
                  placeholder: field.label,
                  stateKey: `form_${field.name}`,
                  thyBasis: 'calc(20% - 13px)'
                }
              }))
            },
            {
              id: 'crud-actions',
              componentType: 'section',
              props: {
                title: 'CRUD Actions',
                thyDirection: 'row',
                thyWrap: 'wrap',
                thyGap: 12,
                thyBasis: '100%'
              },
              children: [
                {
                  id: 'button-create',
                  componentType: 'button',
                  props: {
                    label: 'Create',
                    buttonType: 'primary',
                    actionId: 'create-record-action'
                  }
                },
                {
                  id: 'button-update',
                  componentType: 'button',
                  props: {
                    label: 'Update',
                    buttonType: 'primary-outline',
                    actionId: 'update-record-action'
                  }
                },
                {
                  id: 'button-delete',
                  componentType: 'button',
                  props: {
                    label: 'Delete',
                    buttonType: 'danger-outline',
                    actionId: 'delete-record-action'
                  }
                },
                {
                  id: 'button-clear',
                  componentType: 'button',
                  props: {
                    label: 'Clear Editor',
                    buttonType: 'default',
                    actionId: 'clear-editor-action'
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ];
}

function createResultsTableNode(draft: NgxLowcodeDatasourceDraft): NgxLowcodeNodeSchema {
  return {
    id: 'results-table',
    componentType: 'table',
    props: {
      title: `${draft.label} Results`,
      dataKey: 'tableData',
      rowClickActionId: 'select-row-action'
    }
  };
}

function bindNode(node: NgxLowcodeNodeSchema, binding: NgxLowcodeBindingDraft): NgxLowcodeNodeSchema {
  const nextNode: NgxLowcodeNodeSchema = {
    ...node,
    props:
      node.id === binding.nodeId
        ? {
            ...node.props,
            datasourceId: binding.datasourceId,
            dataKey: binding.dataKey,
            ...(binding.rowClickActionId ? { rowClickActionId: binding.rowClickActionId } : {})
          }
        : node.props,
    children: node.children?.map((child) => bindNode(child, binding))
  };
  return nextNode;
}
