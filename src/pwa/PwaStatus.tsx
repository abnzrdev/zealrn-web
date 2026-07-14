import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;
  return (
    <aside className="pwa-notice" role="status">
      {needRefresh ? <RefreshCw aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      <span>{needRefresh ? 'An update is ready.' : 'ZealRN Web is ready to use offline.'}</span>
      {needRefresh && <button type="button" onClick={() => void updateServiceWorker(true)}>Reload to update</button>}
      <button className="icon-button" type="button" aria-label="Dismiss notification" onClick={() => { setOfflineReady(false); setNeedRefresh(false); }}><X /></button>
    </aside>
  );
}
