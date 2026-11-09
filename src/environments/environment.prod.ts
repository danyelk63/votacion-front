/**
 * Producción (Vercel): el frontend llama directo al backend publicado en Render.
 * El gateway permite CORS, y Vercel no puede hacer de proxy para WebSocket.
 */
const BACKEND = 'votacion-back-u8f6.onrender.com';

export const environment = {
  apiBase: `https://${BACKEND}/api`,
  wsUrl: `wss://${BACKEND}/ws` as string | null,
};
