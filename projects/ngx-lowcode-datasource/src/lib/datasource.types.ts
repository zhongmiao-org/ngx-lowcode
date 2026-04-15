export interface NgxLowcodeDatasourceFieldDraft {
  id: string;
  name: string;
  label: string;
  type: string;
  filterable: boolean;
  editable: boolean;
  searchable: boolean;
}

export interface NgxLowcodeDatasourceDraft {
  id: string;
  tableId: string;
  label: string;
  endpoint: string;
  mutationEndpoint: string;
  keyField: string;
  fields: NgxLowcodeDatasourceFieldDraft[];
}

export interface NgxLowcodeBindingDraft {
  nodeId: string;
  datasourceId: string;
  dataKey: string;
  rowClickActionId?: string;
}
