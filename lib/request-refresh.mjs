// Request-driven Sheet refresh: works on serverless hosts without a cron schedule. The page is never held back for
// the Sheet: the current catalogue (bundled or last valid Sheet read) is served while the check runs in the
// background (`background` is Vercel's waitUntil, or a no-op on the local server).
// A check starts when this instance's last successful read is older than `interval` (about five minutes), and at
// most once per `checkInterval`, so a failing Sheet is retried about once a minute rather than on every request.
export function requestRefresh(store, {interval = 300000, checkInterval = 60000, now = Date.now} = {}) {
  let nextCheck = 0;
  return function prepare(background = () => {}) {
    if (!store.readSource || store.pending || now() < nextCheck || now() - store.verifiedAt < interval) return;
    nextCheck = now() + checkInterval;
    background(store.refresh());
  };
}
