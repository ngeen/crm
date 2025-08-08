const { createProxyMiddleware } = require('http-proxy-middleware');

const target = process.env.REACT_APP_API_URL || 'http://localhost:3001';

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
    })
  );
};