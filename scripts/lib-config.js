/**
 * Where to load the federated ("fedlibs") project from, per environment.
 * Replace bkandala with your actual GitHub org / da.live org once both
 * projects are live.
 */
const LIBS_ORIGINS = {
  local: 'http://localhost:4001',
  preview: 'https://main--fedlibs--bkandala.aem.page',
  live: 'https://main--fedlibs--bkandala.aem.live',
};

// eslint-disable-next-line import/prefer-default-export
export function getLibsOrigin() {
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return LIBS_ORIGINS.local;
  if (hostname.endsWith('.aem.page') || hostname.endsWith('.hlx.page')) return LIBS_ORIGINS.preview;
  return LIBS_ORIGINS.live;
}
