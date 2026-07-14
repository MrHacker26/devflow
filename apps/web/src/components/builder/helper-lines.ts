import type { Node } from '@xyflow/react';

export type HelperLines = {
  horizontal: number | null;
  vertical: number | null;
};

const SNAP_THRESHOLD = 8;

/** Snap the dragging node to nearby node edges/centers and return guide lines. */
export function getHelperLines(
  node: Node,
  nodes: Node[],
  nodeWidth = 200,
  nodeHeight = 90,
): { position: { x: number; y: number }; lines: HelperLines } {
  const others = nodes.filter((item) => item.id !== node.id && !item.hidden);
  let x = node.position.x;
  let y = node.position.y;
  let horizontal: number | null = null;
  let vertical: number | null = null;

  const dragLeft = x;
  const dragRight = x + nodeWidth;
  const dragTop = y;
  const dragBottom = y + nodeHeight;
  const dragCenterX = x + nodeWidth / 2;
  const dragCenterY = y + nodeHeight / 2;

  for (const other of others) {
    const width = (other.measured?.width ?? other.width ?? nodeWidth) as number;
    const height = (other.measured?.height ?? other.height ?? nodeHeight) as number;
    const left = other.position.x;
    const right = left + width;
    const top = other.position.y;
    const bottom = top + height;
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Vertical guides (x)
    const xCandidates = [
      { distance: Math.abs(dragLeft - left), nextX: left, line: left },
      { distance: Math.abs(dragLeft - right), nextX: right, line: right },
      { distance: Math.abs(dragRight - left), nextX: left - nodeWidth, line: left },
      { distance: Math.abs(dragRight - right), nextX: right - nodeWidth, line: right },
      { distance: Math.abs(dragCenterX - centerX), nextX: centerX - nodeWidth / 2, line: centerX },
    ];
    for (const candidate of xCandidates) {
      if (candidate.distance < SNAP_THRESHOLD) {
        x = candidate.nextX;
        vertical = candidate.line;
        break;
      }
    }

    // Horizontal guides (y)
    const yCandidates = [
      { distance: Math.abs(dragTop - top), nextY: top, line: top },
      { distance: Math.abs(dragTop - bottom), nextY: bottom, line: bottom },
      { distance: Math.abs(dragBottom - top), nextY: top - nodeHeight, line: top },
      { distance: Math.abs(dragBottom - bottom), nextY: bottom - nodeHeight, line: bottom },
      { distance: Math.abs(dragCenterY - centerY), nextY: centerY - nodeHeight / 2, line: centerY },
    ];
    for (const candidate of yCandidates) {
      if (candidate.distance < SNAP_THRESHOLD) {
        y = candidate.nextY;
        horizontal = candidate.line;
        break;
      }
    }
  }

  return { position: { x, y }, lines: { horizontal, vertical } };
}
