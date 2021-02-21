const fs = require("fs");
const path = require("path");

const { CONTENT_ROOT, execGit } = require("../content");

function getFromGit(contentRoot = CONTENT_ROOT) {
  // If `contentRoot` was a symlink, the `repoRoot` won't be. That'll make it
  // impossible to compute the relative path for files within when we get
  // output back from `git log ...`.
  // So, always normalize to the real path.
  const realContentRoot = fs.realpathSync(contentRoot);

  const repoRoot = execGit(["rev-parse", "--show-toplevel"], {
    cwd: realContentRoot,
  });

  const MARKER = "COMMIT:";
  const DELIMITER = "_";
  const output = execGit(
    [
      "log",
      "--name-only",
      "--no-decorate",
      `--format=${MARKER}%H${DELIMITER}%cI`,
      "--date-order",
      "--reverse",
      // "Separate the commits with NULs instead of with new newlines."
      // So each line isn't, possibly, wrapped in "quotation marks".
      // Now we just need to split the output, as a string, by \0.
      "-z",
    ],
    {
      cwd: repoRoot,
    },
    repoRoot
  );

  const map = new Map();
  let date = null;
  let hash = null;
  // Even if we specified the `-z` option to `git log ...` above, sometimes
  // it seems `git log` prefers to use a newline character.
  // At least as of git version 2.28.0 (Dec 2020). So let's split on both
  // characters to be safe.
  for (const line of output.split(/\0|\n/)) {
    if (line.startsWith(MARKER)) {
      const data = line.replace(MARKER, "").split(DELIMITER);
      hash = data[0];
      date = new Date(data[1]);
    } else if (line) {
      const relPath = path.relative(realContentRoot, path.join(repoRoot, line));
      map.set(relPath, { date, hash });
    }
  }
  return map;
}

function gather(contentRoot, previousFile = null) {
  const map = new Map();
  if (previousFile) {
    const previous = JSON.parse(fs.readFileSync(previousFile, "utf-8"));
    for (const [key, value] of Object.entries(previous)) {
      map.set(key, value);
    }
  }
  // Every key in this map is a path, relative to CONTENT_ROOT.
  for (const [key, value] of getFromGit(contentRoot)) {
    // Because CONTENT_ROOT isn't necessarily the same as the path relative to
    // the git root. For example "../README.md" and since those aren't documents
    // exclude them.
    // We also only care about documents.
    if (
      !key.startsWith(".") &&
      (key.endsWith("index.html") || key.endsWith("index.md"))
    ) {
      map.set(key, {
        modified: value.date,
        hash: value.hash,
      });
    }
  }
  return map;
}

function getRecentGitFiles(contentRoot, hours) {
  const files = [];
  const now = new Date();
  for (const [key, value] of gather(contentRoot)) {
    const { modified } = value;
    const ageHours = (now.getTime() - modified.getTime()) / 1000 / 3600;
    if (ageHours < hours) {
      files.push(key);
    }
  }
  return files;
}

module.exports = {
  gather,
  getRecentGitFiles,
};
