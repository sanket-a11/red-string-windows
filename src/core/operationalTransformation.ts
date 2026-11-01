/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Section 8: Fate Watch Telemetry Engine
 * Ghost Teleprompter operational transformation sub-character deltas (insert, delete, cursor_pos).
 */

export type DeltaType = 'insert' | 'delete' | 'cursor_pos';

export interface OTDelta {
  seq: number;
  type: DeltaType;
  pos: number;
  text?: string;
  len?: number;
  timestamp: number;
}

export interface FateWatchState {
  buffer: string;
  cursorPos: number;
  lastDeltaTime: number;
  deltas: OTDelta[];
}

/**
 * Creates initial Fate Watch document state.
 */
export function createFateWatchState(initialText: string = ''): FateWatchState {
  return {
    buffer: initialText,
    cursorPos: initialText.length,
    lastDeltaTime: Date.now(),
    deltas: [],
  };
}

/**
 * Applies an operational transformation delta deterministically to the buffer.
 */
export function applyOTDelta(state: FateWatchState, delta: OTDelta): FateWatchState {
  let newBuffer = state.buffer;
  let newCursor = state.cursorPos;

  switch (delta.type) {
    case 'insert': {
      const insText = delta.text || '';
      const safePos = Math.max(0, Math.min(delta.pos, newBuffer.length));
      newBuffer = newBuffer.slice(0, safePos) + insText + newBuffer.slice(safePos);
      newCursor = safePos + insText.length;
      break;
    }
    case 'delete': {
      const delLen = delta.len || 1;
      const safePos = Math.max(0, Math.min(delta.pos, newBuffer.length));
      const endPos = Math.min(safePos + delLen, newBuffer.length);
      newBuffer = newBuffer.slice(0, safePos) + newBuffer.slice(endPos);
      newCursor = safePos;
      break;
    }
    case 'cursor_pos': {
      newCursor = Math.max(0, Math.min(delta.pos, newBuffer.length));
      break;
    }
  }

  return {
    buffer: newBuffer,
    cursorPos: newCursor,
    lastDeltaTime: delta.timestamp || Date.now(),
    deltas: [...state.deltas.slice(-99), delta], // Keep last 100 deltas in memory
  };
}

/**
 * Computes sub-character diff deltas between old text and new text.
 */
export function computeDeltasBetween(
  oldText: string,
  newText: string,
  cursor: number,
  startSeq: number
): OTDelta[] {
  const deltas: OTDelta[] = [];
  const now = Date.now();

  // Find common prefix
  let prefixLen = 0;
  while (
    prefixLen < oldText.length &&
    prefixLen < newText.length &&
    oldText[prefixLen] === newText[prefixLen]
  ) {
    prefixLen++;
  }

  // Find common suffix
  let oldSuffixIdx = oldText.length - 1;
  let newSuffixIdx = newText.length - 1;
  while (
    oldSuffixIdx >= prefixLen &&
    newSuffixIdx >= prefixLen &&
    oldText[oldSuffixIdx] === newText[newSuffixIdx]
  ) {
    oldSuffixIdx--;
    newSuffixIdx--;
  }

  const deleteCount = oldSuffixIdx - prefixLen + 1;
  const insertText = newText.slice(prefixLen, newSuffixIdx + 1);

  let seq = startSeq;

  if (deleteCount > 0) {
    deltas.push({
      seq: seq++,
      type: 'delete',
      pos: prefixLen,
      len: deleteCount,
      timestamp: now,
    });
  }

  if (insertText.length > 0) {
    deltas.push({
      seq: seq++,
      type: 'insert',
      pos: prefixLen,
      text: insertText,
      timestamp: now,
    });
  }

  deltas.push({
    seq: seq++,
    type: 'cursor_pos',
    pos: cursor,
    timestamp: now,
  });

  return deltas;
}
