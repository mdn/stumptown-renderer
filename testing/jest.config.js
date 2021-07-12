const expectPuppeteer = require("expect-puppeteer");

expectPuppeteer.setDefaultOptions({ timeout: 3000 });

module.exports = {
  preset: "jest-puppeteer",
};
