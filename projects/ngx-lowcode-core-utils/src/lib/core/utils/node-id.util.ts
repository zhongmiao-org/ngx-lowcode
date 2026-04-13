let nodeCounter = 0;

export function createNodeId(prefix = 'node'): string {
  nodeCounter += 1;
  return `${prefix}-${nodeCounter}`;
}
