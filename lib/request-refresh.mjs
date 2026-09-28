// Request-driven Sheet refresh: works on serverless hosts without a cron schedule. Nothing runs on a timer: a check is
// started by an incoming request, so an idle site checks on its next visit. The page is never held back for the Sheet:
// the current catalogue (bundled or last valid Sheet read) is served while the check runs in the background
// (`background` is Vercel's waitUntil, or a no-op on the local server).
// Each server instance keeps its own clock: it reads the Sheet on its first request after start-up, then again once
// its last successful read is older than `interval` (REFRESH_SECONDS, six hours by default). A failed or invalid
// read does not count, so it is retried sooner: at most once per `checkInterval` (a minute) while requests arrive.
export function requestRefresh(store, {interval = 21600e3, checkInterval = 60000, now = Date.now} = {}) {
  let nextCheck = 0;
  return function prepare(background = () => {}) {
    if (!store.readSource || store.pending || now() < nextCheck || now() - store.verifiedAt < interval) return;
    nextCheck = now() + checkInterval;
    background(store.refresh());
  };
}
