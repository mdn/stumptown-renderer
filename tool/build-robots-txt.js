/**
 * This script generates a /robots.txt file that depends on
 * process.env.BUILD_ALWAYS_ALLOW_ROBOTS.
 *
 */
const fs = require("fs");

const { VALID_LOCALES } = require("../libs/constants");
const { ALWAYS_ALLOW_ROBOTS } = require("../build/constants");

const ALLOW_TEXT = `
User-agent: *
Sitemap: https://developer.mozilla.org/sitemap.xml

Disallow: /api/
Disallow: /*/files/
Disallow: /media
`;

const DISALLOW_TEXT = `
User-Agent: *

Disallow: /
`;

async function runBuildRobotsTxt(outfile) {
  let content = ALWAYS_ALLOW_ROBOTS ? ALLOW_TEXT : DISALLOW_TEXT;
  if (ALWAYS_ALLOW_ROBOTS) {
    // Append extra lines specifically when we do allow robots.
    for (const locale of VALID_LOCALES.values()) {
      content += `Disallow: /${locale}/search\n`;
    }
  }
  fs.writeFileSync(outfile, `${content.trim()}\n`, "utf-8");
}

module.exports = { runBuildRobotsTxt };
