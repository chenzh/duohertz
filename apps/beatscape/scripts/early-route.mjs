/**
 * Start one route-chunk modulepreload from the parsed pathname, before the
 * application entry has downloaded and executed. The function is serialized
 * into release HTML, so keep it self-contained and dependency-free.
 */
export function startEarlyRoute(chunks, pathname, doc) {
  if (!chunks || typeof pathname !== 'string' || !doc?.head || !doc.createElement) return null;

  let path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/beatscape') path = '/';
  else if (path.startsWith('/beatscape/')) path = path.slice('/beatscape'.length) || '/';

  let key = null;
  if (path.startsWith('/track/')) key = 'track';
  else if (path.startsWith('/duo/')) key = 'duo';
  else if (path === '/characters') key = 'characters';
  else if (path === '/radio') key = 'radio';
  else if (path === '/shift') key = 'shift';
  else if (path === '/calibrate') key = 'calibrate';
  else if (path === '/settings') key = 'settings';
  else if (path === '/leaderboard') key = 'leaderboard';
  else if (path === '/profile') key = 'profile';
  else if (path === '/privacy' || path === '/terms') key = 'legal';
  else if (path !== '/' && path !== '/library' && !path.startsWith('/play/') && path !== '/results') key = 'notFound';
  if (!key) return null;

  const href = chunks[key];
  if (typeof href !== 'string' || !/^\/assets\/[A-Za-z0-9_-]+\.js$/.test(href)) return null;
  const selector = `link[data-beatscape-route-preload="${key}"]`;
  const existing = doc.querySelector?.(selector);
  if (existing) return existing;

  const link = doc.createElement('link');
  link.rel = 'modulepreload';
  link.crossOrigin = 'anonymous';
  link.href = href;
  link.setAttribute('data-beatscape-route-preload', key);
  doc.head.append(link);
  return link;
}
