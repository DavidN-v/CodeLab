// Dev-server proxy: the browser calls /api on the Angular origin and the dev
// server forwards it, so the app uses the same relative URLs as in production.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080';

export default {
  '/api': {
    target: apiTarget,
    secure: false,
  },
};
