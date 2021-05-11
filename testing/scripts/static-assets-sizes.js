/**
 * Called by a GitHub Action workflow that executes this script like this:
 *
 *   const script = require('./testing/scripts/static-assets-sizes.js')
 *   const comment = script({github, context})
 *
 * The objective with this is to print out a Markdown table that details
 * the file sizes of the main JS and the main CSS bundle.
 */
const fs = require("fs");
const path = require("path");

function main() {
  const rows = [];
  for (const filepath of walker("client/build/static")) {
    if (
      path.basename(filepath).startsWith("main.") &&
      (path.extname(filepath) === ".js" || path.extname(filepath) === ".css")
    ) {
      rows.push([
        formatFilepath(filepath),
        formatFilesize(fs.statSync(filepath).size),
      ]);
    }
  }
  return markdownTable(rows, ["File", "Size"]);
}

function formatFilepath(filepath, bits = 3) {
  const split = filepath.split(path.sep);
  return split.slice(split.length - bits, split.length).join(path.sep);
}

function formatFilesize(bytes) {
  if (bytes > 1024 * 1024) {
    return `${(bytes / 1024.0 / 1024.0).toFixed(2)}MB`;
  }
  if (bytes > 1024) {
    return `${(bytes / 1024.0).toFixed(2)}KB`;
  }
  return `${bytes}b`;
}

function markdownTable(rows, headings) {
  const lines = [];
  lines.push(`| ${headings.join(" | ")} |`);
  lines.push(`| ${headings.map(() => "---").join(" | ")} |`);
  rows.forEach((row) => {
    lines.push(`| ${row.join(" | ")} |`);
  });
  lines.push("");

  return lines.join("\n");
}

function* walker(root) {
  const files = fs.readdirSync(root);
  for (const name of files) {
    const filepath = path.join(root, name);
    const isDirectory = fs.statSync(filepath).isDirectory();
    if (isDirectory) {
      yield* walker(filepath);
    } else {
      yield filepath;
    }
  }
}
module.exports = main;

// To test this script, uncomment the lines below and run:
//
//    node testing/scripts/static-assets-sizes.js
//
// console.log(
//   main({
//     context: {
//       payload: {
//         client_payload: "Test",
//       },
//     },
//   })
// );
