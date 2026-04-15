export type NgxLowcodeMetaColumnType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'json';

export type NgxLowcodeMetaTableKind = 'root' | 'child';

export interface NgxLowcodeMetaColumnDraft {
  id: string;
  name: string;
  type: NgxLowcodeMetaColumnType;
  required: boolean;
  primary: boolean;
}

export interface NgxLowcodeMetaTableDraft {
  id: string;
  name: string;
  label: string;
  kind: NgxLowcodeMetaTableKind;
  parentTableId?: string;
  columns: NgxLowcodeMetaColumnDraft[];
}

export interface NgxLowcodeMetaRelationDraft {
  id: string;
  name: string;
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  kind: 'many-to-one' | 'one-to-many';
}

export interface NgxLowcodeMetaIndexDraft {
  id: string;
  name: string;
  tableId: string;
  columnIds: string[];
  unique: boolean;
}

export interface NgxLowcodeMetaModelDraft {
  id: string;
  name: string;
  description: string;
  tables: NgxLowcodeMetaTableDraft[];
  relations: NgxLowcodeMetaRelationDraft[];
  indexes: NgxLowcodeMetaIndexDraft[];
}

export interface NgxLowcodeMetaModelValidationIssue {
  path: string;
  message: string;
}
