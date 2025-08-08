const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://backend:3001', // The backend service name in docker-compose
      changeOrigin: true,
    })
  );
};