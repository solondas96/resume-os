/**
 * Offline and update notices for the PWA. A new version is never applied silently:
 * the user chooses when to reload.
 */

import React, { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const UpdatePrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [update, setUpdate] = useState<((reload: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
    setUpdate(() => updateSW);
  }, []);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div role="status" className="no-print fixed bottom-12 left-3 z-50 max-w-xs bg-card border border-border rounded-xl shadow-lifted p-3 text-xs space-y-2">
      <div className="text-foreground">
        {needRefresh ? 'A new version of ResumeLabs is ready.' : 'ResumeLabs is ready to work offline.'}
      </div>
      <div className="flex gap-2">
        {needRefresh && (
          <button type="button" onClick={() => update?.(true)} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground min-h-[32px]">
            Reload to update
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setNeedRefresh(false);
            setOfflineReady(false);
          }}
          className="px-3 py-1.5 rounded-md bg-muted text-foreground min-h-[32px]"
        >
          {needRefresh ? 'Later' : 'OK'}
        </button>
      </div>
    </div>
  );
};
