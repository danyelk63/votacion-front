/**
 * Desarrollo: `ng serve` redirige /api y /ws al gateway local (proxy.conf.json).
 */
export const environment = {
  apiBase: '/api',
  /** null = mismo host que la página (/ws) */
  wsUrl: null as string | null,
};
