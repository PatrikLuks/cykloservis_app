export function prefetchCommon() {
  if (typeof window === 'undefined') return;
  const run = () => {
    try {
      import(/* webpackPrefetch: true */ '../pages/MyBikes');
      import(/* webpackPrefetch: true */ '../pages/Orders');
      import(/* webpackPrefetch: true */ '../pages/Profile');
    } catch {}
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 3000 });
  } else {
    setTimeout(run, 1500);
  }
}
