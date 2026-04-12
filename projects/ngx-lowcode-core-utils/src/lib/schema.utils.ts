import {
  NgxLowcodeActionDefinition,
  NgxLowcodeComponentDefinition,
  NgxLowcodeDatasourceDefinition,
  NgxLowcodeDropTarget,
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

export function findNodeLocation(
  nodes: NgxLowcodeNodeSchema[],
  nodeId: string,
  parentId: string | null = null
): { parentId: string | null; slot: string | null; index: number } | null {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.id === nodeId) {
      return {
        parentId,
        slot: node.slot ?? null,
        index
      };
    }

    const nested = findNodeLocation(node.children ?? [], nodeId, node.id);
    if (nested) {
      return nested;
    }
  }

  return null;
}

export function resolveDropTargetInsertion(
  nodes: NgxLowcodeNodeSchema[],
  target: NgxLowcodeDropTarget
): { parentId: string | null; slot: string | null; insertionIndex: number | null } {
  const position = target.position ?? 'inside';

  if (position === 'inside' || !target.targetNodeId) {
    return {
      parentId: target.parentId,
      slot: target.slot ?? null,
      insertionIndex: target.insertionIndex ?? null
    };
  }

  const location = findNodeLocation(nodes, target.targetNodeId);
  if (!location) {
    return {
      parentId: target.parentId,
      slot: target.slot ?? null,
      insertionIndex: target.insertionIndex ?? null
    };
  }

  return {
    parentId: location.parentId,
    slot: location.slot,
    insertionIndex: location.index + (position === 'after' ? 1 : 0)
  };
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

function insertIntoSiblings(
  siblings: NgxLowcodeNodeSchema[],
  nextNode: NgxLowcodeNodeSchema,
  slot: string | null,
  insertionIndex: number | null
): NgxLowcodeNodeSchema[] {
  if (insertionIndex === null || insertionIndex === undefined) {
    return [...siblings, nextNode];
  }

  const normalizedSlot = slot ?? null;
  const slottedIndices = siblings
    .map((child, index) => ({ child, index }))
    .filter(({ child }) => (child.slot ?? null) === normalizedSlot)
    .map(({ index }) => index);

  const boundedIndex = Math.max(0, Math.min(insertionIndex, slottedIndices.length));

  if (!slottedIndices.length) {
    const nextSiblings = [...siblings];
    nextSiblings.splice(boundedIndex, 0, nextNode);
    return nextSiblings;
  }

  const absoluteIndex =
    boundedIndex >= slottedIndices.length ? slottedIndices[slottedIndices.length - 1] + 1 : slottedIndices[boundedIndex];
  const nextSiblings = [...siblings];
  nextSiblings.splice(absoluteIndex, 0, nextNode);
  return nextSiblings;
}

export function insertNode(
  nodes: NgxLowcodeNodeSchema[],
  parentId: string | null,
  nextNode: NgxLowcodeNodeSchema,
  slot?: string | null,
  insertionIndex?: number | null
): NgxLowcodeNodeSchema[] {
  if (!parentId) {
    return insertIntoSiblings(nodes, nextNode, slot ?? null, insertionIndex ?? null);
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: insertIntoSiblings(node.children ?? [], nextNode, slot ?? null, insertionIndex ?? null)
      };
    }
    return {
      ...node,
      children: insertNode(node.children ?? [], parentId, nextNode, slot, insertionIndex)
    };
  });
}

export function isDescendantNode(nodes: NgxLowcodeNodeSchema[], ancestorId: string, nodeId: string): boolean {
  const ancestor = findNodeById(nodes, ancestorId);
  if (!ancestor) {
    return false;
  }
  return Boolean(findNodeById(ancestor.children ?? [], nodeId));
}

export function removeNodeAndReturn(
  nodes: NgxLowcodeNodeSchema[],
  nodeId: string
): { nodes: NgxLowcodeNodeSchema[]; removedNode: NgxLowcodeNodeSchema | null } {
  let removedNode: NgxLowcodeNodeSchema | null = null;

  const nextNodes = nodes
    .filter((node) => {
      if (node.id === nodeId) {
        removedNode = node;
        return false;
      }
      return true;
    })
    .map((node) => {
      const result = removeNodeAndReturn(node.children ?? [], nodeId);
      if (result.removedNode) {
        removedNode = result.removedNode;
      }
      return {
        ...node,
        children: result.nodes
      };
    });

  return {
    nodes: nextNodes,
    removedNode
  };
}

export function moveNode(
  nodes: NgxLowcodeNodeSchema[],
  nodeId: string,
  parentId: string | null,
  slot?: string | null,
  insertionIndex?: number | null
): NgxLowcodeNodeSchema[] {
  if (nodeId === parentId || (parentId && isDescendantNode(nodes, nodeId, parentId))) {
    return nodes;
  }

  const result = removeNodeAndReturn(nodes, nodeId);
  if (!result.removedNode) {
    return nodes;
  }

  const nextNode: NgxLowcodeNodeSchema = {
    ...result.removedNode,
    slot: slot ?? undefined
  };

  return insertNode(result.nodes, parentId, nextNode, slot, insertionIndex ?? null);
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
