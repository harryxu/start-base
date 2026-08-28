const target = `http://localhost:${process.env.DEV_API_PORT || 5600}`;

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
  },
  '/static': {
    target,
    secure: false,
    changeOrigin: true,
  },
};
