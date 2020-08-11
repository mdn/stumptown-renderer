const fs = require("fs");
const path = require("path");

const glob = require("glob");

const { popularities } = require("../content");
const { FLAW_LEVELS, options: buildOptions } = require("../build");

const BUILD_OUT_ROOT = path.join(__dirname, "..", "client", "build");

function anyMatchSearchFlaws(searchFlaws, flaws) {
  for (const [flaw, search] of searchFlaws) {
    if (!flaws[flaw]) {
      continue;
    }

    if (flaw !== "macros") {
      if (JSON.stringify(flaws[flaw]).includes(search)) {
        return true;
      }
    } else if (
      flaws[flaw].some((flawError) =>
        typeof flawError === "string"
          ? flawError.includes(search)
          : Object.values(flawError).some((value) =>
              String(value).includes(search)
            )
      )
    ) {
      return true;
    }
  }
  return false;
}

function validPopularityFilter(value) {
  let filter = null;
  if (value) {
    if (/[^\d<>]/.test(value)) {
      return [null, "popularity contains unrecognized characters"];
    }
    if (value.startsWith("<")) {
      filter = { min: parseInt(value.slice(1).trim()) };
    } else if (value.startsWith(">")) {
      filter = { max: parseInt(value.slice(1).trim()) };
    } else {
      throw new Error("Not implemented");
    }
  }
  return [filter, null];
}

function serializeFlawLevels(flawLevels) {
  const keys = [...flawLevels.keys()];
  keys.sort();
  return keys.map((key) => {
    return {
      name: key,
      level: flawLevels.get(key),
      ignored: flawLevels.get(key) === FLAW_LEVELS.IGNORE,
    };
  });
}

function packageFlaws(flawsObj) {
  const packaged = [];
  const keys = Object.keys(flawsObj);
  keys.sort();
  for (const name of keys) {
    let value = flawsObj[name];
    if (Array.isArray(value)) {
      value = value.length;
    }
    packaged.push({ name, value });
  }
  return packaged;
}

// We can't just open the `index.json` and return it like that in the XHR
// payload. It's too much stuff and some values need to be repackaged/
// serialized or some other transformation computation.
function packageDocument(doc) {
  const { modified, mdn_url, title } = doc;
  const popularity = {
    value: doc.popularity,
    ranking: doc.popularity
      ? 1 + Object.values(popularities).filter((p) => p > doc.popularity).length
      : NaN,
  };
  const flaws = packageFlaws(doc.flaws);
  return { popularity, flaws, modified, mdn_url, title };
}

module.exports = (req, res) => {
  const locale = req.query.locale.toLowerCase();
  if (!locale) {
    return res.status(400).send("'locale' is always required");
  }
  const filters = req.query;

  let page;
  try {
    page = parseInt(req.query.page || "1");
    if (page < 1) {
      return res.status(400).send("'page' number too small");
    }
  } catch (err) {
    return res.status(400).send("'page' number invalid");
  }

  let [popularityFilter, error] = validPopularityFilter(filters.popularity);
  if (error) {
    return res.status(400).send(error.toString());
  }

  const sortBy = req.query.sort || "popularity";
  const sortReverse = JSON.parse(req.query.reverse || "false");

  const DOCUMENTS_PER_PAGE = 25;

  const counts = {
    // Number of documents found with the matching flaws
    found: 0,
    // Number of documents that have been built.
    // Basically a count of client/build/**/index.json files.
    built: 0,
    // Used by the pagination
    pages: 0,
  };

  const documents = [];

  const t1 = new Date();

  let filteredFlaws = new Set();
  if (filters.flaws) {
    if (Array.isArray(filters.flaws)) {
      filteredFlaws = new Set(filters.flaws);
    } else {
      filteredFlaws = new Set([filters.flaws]);
    }
  }

  let searchFlaws = new Map();
  if (filters.search_flaws) {
    if (Array.isArray(filters.search_flaws)) {
      searchFlaws = new Map(filters.search_flaws.map((x) => x.split(":", 2)));
    } else {
      searchFlaws = new Map([filters.search_flaws].map((x) => x.split(":", 2)));
    }
  }

  for (const filePath of glob.sync(
    path.join(BUILD_OUT_ROOT, "**", "index.json")
  )) {
    counts.built++;

    const { doc } = JSON.parse(fs.readFileSync(filePath));

    if (
      !(doc.flaws && Object.keys(doc.flaws).length) ||
      (filters.mdn_url &&
        !doc.mdn_url.toLowerCase().includes(filters.mdn_url.toLowerCase())) ||
      (filters.title &&
        !doc.title.toLowerCase().includes(filters.title.toLowerCase())) ||
      (filteredFlaws.size &&
        !Object.keys(doc.flaws).some((x) => filteredFlaws.has(x))) ||
      (searchFlaws.size && !anyMatchSearchFlaws(searchFlaws, doc.flaws))
    ) {
      continue;
    }
    if (popularityFilter) {
      const docRanking = doc.popularity
        ? 1 +
          Object.values(popularities).filter((p) => p > doc.popularity).length
        : NaN;
      if (popularityFilter.min) {
        if (isNaN(docRanking) || docRanking > popularityFilter.min) {
          continue;
        }
      } else if (popularityFilter.max && docRanking < popularityFilter.max) {
        continue;
      }
    }
    counts.found++;
    documents.push(packageDocument(doc));
  }

  counts.pages = Math.ceil(counts.found / DOCUMENTS_PER_PAGE);

  function countFilteredFlaws(doc) {
    return doc.flaws
      .filter(({ name }) => !filteredFlaws.size || filteredFlaws.has(name))
      .reduce((x, y) => x + y.value, 0);
  }

  const sortMultiplier = sortReverse ? -1 : 1;
  documents.sort((a, b) => {
    switch (sortBy) {
      case "popularity":
        return (
          sortMultiplier *
          ((b.popularity.value || 0) - (a.popularity.value || 0))
        );
      case "flaws":
        return sortMultiplier * (countFilteredFlaws(a) - countFilteredFlaws(b));
      case "mdn_url":
        if (a.mdn_url.toLowerCase() < b.mdn_url.toLowerCase()) {
          return sortMultiplier * -1;
        } else if (a.mdn_url.toLowerCase() > b.mdn_url.toLowerCase()) {
          return sortMultiplier;
        } else {
          return 0;
        }
      default:
        throw new Error("not implemented");
    }
  });

  const t2 = new Date();

  const times = {
    built: t2.getTime() - t1.getTime(),
  };

  let [m, n] = [(page - 1) * DOCUMENTS_PER_PAGE, page * DOCUMENTS_PER_PAGE];

  res.json({
    counts,
    times,
    flawLevels: serializeFlawLevels(buildOptions.flawLevels),

    documents: documents.slice(m, n),
  });
};
