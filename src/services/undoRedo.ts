/**
 * Undo/Redo stack management for the Resume model
 * Separate from named snapshots/revisions
 * Triggered by Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z
 */

import { Resume } from '../model/resume';

interface HistoryEntry {
  resume: Resume;
  timestamp: number;
  label?: string; // Optional label for debugging
}

class UndoRedoManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxStackSize = 50; // Limit memory usage

  /**
   * Push current state onto undo stack
   */
  pushState(resume: Resume, label?: string): void {
    // Clone to avoid mutations
    const entry: HistoryEntry = {
      resume: JSON.parse(JSON.stringify(resume)),
      timestamp: Date.now(),
      label,
    };

    this.undoStack.push(entry);
    this.redoStack = []; // Clear redo stack on new action

    // Limit stack size to avoid memory issues
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo last action (Cmd/Ctrl+Z)
   */
  undo(): Resume | null {
    if (this.undoStack.length === 0) return null;

    const current = this.undoStack.pop();
    if (!current) return null;

    // Push current state to redo stack
    // (This would need the current resume passed in from the caller)
    return current.resume;
  }

  /**
   * Redo last undone action (Cmd/Ctrl+Shift+Z)
   */
  redo(): Resume | null {
    if (this.redoStack.length === 0) return null;

    const entry = this.redoStack.pop();
    return entry ? entry.resume : null;
  }

  /**
   * Push to redo stack (called when user performs undo)
   */
  pushToRedoStack(resume: Resume, label?: string): void {
    const entry: HistoryEntry = {
      resume: JSON.parse(JSON.stringify(resume)),
      timestamp: Date.now(),
      label,
    };

    this.redoStack.push(entry);

    if (this.redoStack.length > this.maxStackSize) {
      this.redoStack.shift();
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get current stack sizes (for debugging)
   */
  getStackInfo(): { undoSize: number; redoSize: number } {
    return {
      undoSize: this.undoStack.length,
      redoSize: this.redoStack.length,
    };
  }
}

// Singleton instance
export const undoRedoManager = new UndoRedoManager();

/**
 * Setup keyboard shortcuts for undo/redo
 * Call once on app initialization
 */
export function setupUndoRedoKeyBindings(
  onUndo: () => void,
  onRedo: () => void
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (isCmdOrCtrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      onUndo();
    } else if (isCmdOrCtrl && (e.key === 'Z' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      onRedo();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}
