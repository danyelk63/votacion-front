const BACKEND = 'votacion-back-u8f6.onrender.com';

export const environment = {
  apiBase: `https://${BACKEND}/api`,
  wsUrl: `wss://${BACKEND}/ws` as string | null,
};
