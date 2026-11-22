/**
 * Undo/Redo stack for the Resume model.
 * Separate from named snapshots/revisions.
 * Triggered by Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z.
 */

import { Resume } from '../model/resume';

const MAX_STACK_SIZE = 50;

/** A point in history: the structured model, and the exact editor text it came from */
export interface Snapshot {
  resume: Resume;
  text: string;
}

function clone(snapshot: Snapshot): Snapshot {
  return JSON.parse(JSON.stringify(snapshot));
}

class UndoRedoManager {
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];

  /** Record a state before a change. Clears redo history, as any editor does. */
  record(previous: Snapshot): void {
    this.undoStack.push(clone(previous));
    this.redoStack = [];
    if (this.undoStack.length > MAX_STACK_SIZE) this.undoStack.shift();
  }

  /** Undo: returns the previous state, and keeps `current` available for redo. */
  undo(current: Snapshot): Snapshot | null {
    const previous = this.undoStack.pop();
    if (!previous) return null;
    this.redoStack.push(clone(current));
    if (this.redoStack.length > MAX_STACK_SIZE) this.redoStack.shift();
    return previous;
  }

  /** Redo: returns the next state, and keeps `current` available for undo. */
  redo(current: Snapshot): Snapshot | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(clone(current));
    if (this.undoStack.length > MAX_STACK_SIZE) this.undoStack.shift();
    return next;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getStackInfo(): { undoSize: number; redoSize: number } {
    return { undoSize: this.undoStack.length, redoSize: this.redoStack.length };
  }
}

export const undoRedoManager = new UndoRedoManager();

/**
 * Setup keyboard shortcuts for undo/redo.
 * Returns a cleanup function.
 */
export function setupUndoRedoKeyBindings(onUndo: () => void, onRedo: () => void): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
    if (!isCmdOrCtrl || e.key.toLowerCase() !== 'z') return;

    e.preventDefault();
    if (e.shiftKey) onRedo();
    else onUndo();
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}
