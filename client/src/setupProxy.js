const { createProxyMiddleware } = require("http-proxy-middleware");

const SERVER_PORT = process.env.SERVER_PORT || 5000;

console.log(`Setting up a Proxy to localhost:${SERVER_PORT}`);
module.exports = function (app) {
  const proxy = createProxyMiddleware({
    target: `http://localhost:${SERVER_PORT}`,
    changeOrigin: true,
  });
  app.use("/api", proxy);
  app.use("/*/users/account/signup", proxy);
  app.use("/_+(flaws|translations|open|document)", proxy);
  // E.g. search-index.json or index.json
  app.use("**/*.json", proxy);
  // This has to match what we do in server/index.js in the catchall handler
  app.use("**/*.(png|webp|gif|jpe?g|svg)", proxy);
  // All those root-level images like /favicon-48x48.png
  app.use("/*.(png|webp|gif|jpe?g|svg)", proxy);
  // This needs to match what we put into content/constants.js
  // in the keys of the VALID_FILE_TYPES map.
  app.use("**/*.(ttf|woff2?)", proxy);
};
