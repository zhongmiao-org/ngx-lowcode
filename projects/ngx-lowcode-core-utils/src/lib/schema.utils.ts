import {
  NgxLowcodeActionDefinition,
  NgxLowcodeComponentDefinition,
  NgxLowcodeDatasourceDefinition,
  NgxLowcodeNodeSchema,
  NgxLowcodePageSchema
} from 'ngx-lowcode-core-types';

let nodeCounter = 0;

export function createNodeId(prefix = 'node'): string {
  nodeCounter += 1;
  return `${prefix}-${nodeCounter}`;
}

export function createDefaultPageSchema(): NgxLowcodePageSchema {
  return {
    schemaVersion: '1.0.0',
    pageMeta: {
      id: 'page-demo',
      title: 'Lowcode Demo'
    },
    state: {},
    datasources: [],
    actions: [],
    layoutTree: []
  };
}

export function createNodeFromDefinition(definition: NgxLowcodeComponentDefinition): NgxLowcodeNodeSchema {
  return definition.createNode({ id: createNodeId(definition.type) });
}

export function cloneSchema(schema: NgxLowcodePageSchema): NgxLowcodePageSchema {
  return structuredClone(schema);
}

export function findNodeById(nodes: NgxLowcodeNodeSchema[], nodeId: string): NgxLowcodeNodeSchema | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    const child = findNodeById(node.children ?? [], nodeId);
    if (child) {
      return child;
    }
  }
  return undefined;
}

export function findParentNode(nodes: NgxLowcodeNodeSchema[], nodeId: string): NgxLowcodeNodeSchema | undefined {
  for (const node of nodes) {
    const children = node.children ?? [];
    if (children.some((child) => child.id === nodeId)) {
      return node;
    }
    const nested = findParentNode(children, nodeId);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

export function updateNodeById(
  nodes: NgxLowcodeNodeSchema[],
  nodeId: string,
  updater: (node: NgxLowcodeNodeSchema) => NgxLowcodeNodeSchema
): NgxLowcodeNodeSchema[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }
    return {
      ...node,
      children: updateNodeById(node.children ?? [], nodeId, updater)
    };
  });
}

export function removeNodeById(nodes: NgxLowcodeNodeSchema[], nodeId: string): NgxLowcodeNodeSchema[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      children: removeNodeById(node.children ?? [], nodeId)
    }));
}

export function appendNode(
  nodes: NgxLowcodeNodeSchema[],
  parentId: string | null,
  nextNode: NgxLowcodeNodeSchema
): NgxLowcodeNodeSchema[] {
  if (!parentId) {
    return [...nodes, nextNode];
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children ?? []), nextNode]
      };
    }
    return {
      ...node,
      children: appendNode(node.children ?? [], parentId, nextNode)
    };
  });
}

export function duplicateNode(nodes: NgxLowcodeNodeSchema[], nodeId: string): NgxLowcodeNodeSchema[] {
  return duplicateNodeAndReturnId(nodes, nodeId).nodes;
}

export function duplicateNodeAndReturnId(
  nodes: NgxLowcodeNodeSchema[],
  nodeId: string
): { nodes: NgxLowcodeNodeSchema[]; duplicatedNodeId: string | null } {
  const original = findNodeById(nodes, nodeId);
  if (!original) {
    return {
      nodes,
      duplicatedNodeId: null
    };
  }

  const clonedNode = resetNodeIds(structuredClone(original));
  const parent = findParentNode(nodes, nodeId);
  return {
    nodes: appendNode(nodes, parent?.id ?? null, clonedNode),
    duplicatedNodeId: clonedNode.id
  };
}

export function resetNodeIds(node: NgxLowcodeNodeSchema): NgxLowcodeNodeSchema {
  return {
    ...node,
    id: createNodeId(node.componentType),
    children: (node.children ?? []).map((child) => resetNodeIds(child))
  };
}

export function upsertDatasource(
  datasources: NgxLowcodeDatasourceDefinition[],
  datasource: NgxLowcodeDatasourceDefinition
): NgxLowcodeDatasourceDefinition[] {
  const exists = datasources.some((item) => item.id === datasource.id);
  if (!exists) {
    return [...datasources, datasource];
  }
  return datasources.map((item) => (item.id === datasource.id ? datasource : item));
}

export function upsertAction(actions: NgxLowcodeActionDefinition[], action: NgxLowcodeActionDefinition): NgxLowcodeActionDefinition[] {
  const exists = actions.some((item) => item.id === action.id);
  if (!exists) {
    return [...actions, action];
  }
  return actions.map((item) => (item.id === action.id ? action : item));
}
