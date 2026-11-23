/**
 * Catches an error in a part of the screen, so the rest keeps working. Shows a plain message and two
 * actions: reload, and download a backup (from the state as it was before the error, if it can be read).
 */

import React from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { downloadBackupFile } from '../../services/dataSafety';

interface Props {
  /** Shown in the message, for example "The preview" */
  area: string;
  children: React.ReactNode;
  /** A compact fallback for a small panel; the full message is used for the top level */
  compact?: boolean;
  /** Name used by the development-only fault switch (?fault=<id>), see FaultProbe */
  faultId?: string;
}

/**
 * Development only: ?fault=<id> makes that panel throw on render, so the boundary can be tested end to
 * to end. In a production build this component renders its children and nothing else.
 */
function FaultProbe({ id, children }: { id?: string; children: React.ReactNode }) {
  if (import.meta.env.DEV && id && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('fault') === id) {
    throw new Error(`fault injected for ${id} (development only)`);
  }
  return <>{children}</>;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Logged to the console only; nothing is sent anywhere
    console.error(`[${this.props.area}] ${error.message}`, info.componentStack);
  }

  render() {
    if (!this.state.error) return <FaultProbe id={this.props.faultId}>{this.props.children}</FaultProbe>;
    if (this.props.compact) {
      return (
        <div role="alert" className="m-3 p-3 rounded-lg border border-border bg-card text-xs space-y-2">
          <p className="text-foreground">{this.props.area} could not be shown. Your data is safe.</p>
          <button type="button" onClick={() => this.setState({ error: null })} className="px-2.5 py-1 rounded-md bg-muted text-foreground font-medium">
            Try again
          </button>
        </div>
      );
    }
    return <FullFallback error={this.state.error} area={this.props.area} />;
  }
}

/** The top-level message. Its buttons work even when the rest of the screen cannot. */
function FullFallback({ error, area }: { error: Error; area: string }) {
  const download = () => {
    try {
      const s = useResumeStoreV2.getState();
      downloadBackupFile({ resumes: s.resumes, applications: s.applications, coverLetterMarkdown: s.coverLetterMarkdown });
    } catch {
      // The state could not be read; the message still offers a reload
    }
  };
  return (
    <div role="alert" className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 space-y-4 text-center">
        <h1 className="text-lg font-semibold">Something went wrong. Your data is safe.</h1>
        <p className="text-sm text-muted-foreground">
          {area} stopped working. Your resumes are saved in this browser. Download a backup first if you want a copy, then reload.
        </p>
        <details className="text-left text-[11px] text-muted-foreground">
          <summary className="cursor-pointer">Technical detail</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono">{error.message}</pre>
        </details>
        <div className="flex justify-center gap-2">
          <button type="button" onClick={download} className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium">
            Download backup
          </button>
          <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
