const config = require("dotenv").config({ path: "../.env" });

module.exports = {
  env: config.parsed,
};
