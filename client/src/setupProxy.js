const { createProxyMiddleware } = require('http-proxy-middleware');

// The target for the proxy.
// In a Docker environment, this will be set to 'http://backend:3001'.
// For local development (npm run dev), it will default to 'http://localhost:3001'.
const target = process.env.REACT_APP_API_PROXY_TARGET || 'http://localhost:3001';

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
    })
  );
};