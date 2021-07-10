const fs = require("fs");
const path = require("path");

const glob = require("glob");

const { FLAW_LEVELS, options: buildOptions } = require("../build");

const { BUILD_OUT_ROOT } = require("../build/constants");

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
    if (/[^\d<>]/.test(value.replace(/\s+/g, ""))) {
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

function validFixableFlawsFilter(value) {
  let filter = null;
  if (value) {
    if (/[^\d<>]/.test(value.replace(/\s+/g, ""))) {
      return [null, "fixable flaws contains unrecognized characters"];
    }
    if (value.startsWith("<")) {
      filter = { max: parseInt(value.slice(1).trim()) };
    } else if (value.startsWith(">")) {
      filter = { min: parseInt(value.slice(1).trim()) };
    } else {
      filter = { equal: parseInt(parseInt(value)) };
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
    let countFixable = 0;
    if (Array.isArray(value)) {
      countFixable += value.filter((flaw) => flaw.fixable).length;
      value = value.length;
    } else {
      // XXX I don't think this can ever happen.
      countFixable += value.fixable ? 1 : 0;
    }
    packaged.push({ name, value, countFixable });
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
    ranking: doc.popularityRanking || NaN,
  };
  const flaws = packageFlaws(doc.flaws);
  return { popularity, flaws, modified, mdn_url, title };
}

function strMapToObject(map) {
  const obj = Object.create(null);
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
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

  const [popularityFilter, popularityFilterError] = validPopularityFilter(
    filters.popularity
  );
  if (popularityFilterError) {
    return res.status(400).send(popularityFilterError.toString());
  }
  const [fixableFlawsFilter, fixableFlawsFilterError] = validFixableFlawsFilter(
    filters.fixableFlaws
  );
  if (fixableFlawsFilterError) {
    return res.status(400).send(fixableFlawsFilterError.toString());
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

    flaws: {
      // For every encountered flaw.
      total: 0,
      // To know how many of the flaws we encounter are fixable.
      fixable: 0,
      // To keep track of and count *number* of flaws encountered by *type*.
      type: new Map(),
      // To keep track of the various `macros` flaws.
      macros: new Map(),
    },
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
    path.join(BUILD_OUT_ROOT, locale, "**", "index.json")
  )) {
    const { doc } = JSON.parse(fs.readFileSync(filePath));

    // The home page, for example, also uses a `index.json` but it doesn't have
    // flaws, so let's not count it if it doesn't have a `doc` key.
    if (!doc) {
      continue;
    }

    counts.built++;

    if (doc.flaws) {
      for (const [flawKey, actualFlaws] of Object.entries(doc.flaws)) {
        if (!counts.flaws.type.has(flawKey)) {
          counts.flaws.type.set(flawKey, 0);
        }
        counts.flaws.type.set(flawKey, counts.flaws.type.get(flawKey) + 1);

        for (const flaw of actualFlaws) {
          counts.flaws.total++;
          if (flaw.fixable) {
            counts.flaws.fixable++;
          }

          // Dig a little extra deep into these because their flaws
          // always have a `.name` attribute which is interesting.
          if (flawKey === "macros") {
            console.assert(flaw.name, "must have a .name attribute");
            if (!counts.flaws.macros.has(flaw.name)) {
              counts.flaws.macros.set(flaw.name, 0);
            }
            counts.flaws.macros.set(
              flaw.name,
              counts.flaws.macros.get(flaw.name) + 1
            );
          }
        }
      }
    }

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
      const docRanking = doc.popularityRanking || NaN;
      if (popularityFilter.min) {
        if (isNaN(docRanking) || docRanking > popularityFilter.min) {
          continue;
        }
      } else if (popularityFilter.max && docRanking < popularityFilter.max) {
        continue;
      }
    }
    const packaged = packageDocument(doc);
    if (fixableFlawsFilter) {
      const sumFixable = packaged.flaws.reduce(
        (acc, flaw) => flaw.countFixable + acc,
        0
      );
      if ("min" in fixableFlawsFilter && sumFixable <= fixableFlawsFilter.min) {
        continue;
      } else if (
        "max" in fixableFlawsFilter &&
        sumFixable > fixableFlawsFilter.max
      ) {
        continue;
      } else if (
        "equal" in fixableFlawsFilter &&
        sumFixable !== fixableFlawsFilter.equal
      ) {
        continue;
      }
    }

    counts.found++;
    documents.push(packaged);
  }

  counts.flaws.type = strMapToObject(counts.flaws.type);
  counts.flaws.macros = strMapToObject(counts.flaws.macros);

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
        }
        return 0;

      default:
        throw new Error("not implemented");
    }
  });

  const t2 = new Date();

  const times = {
    built: t2.getTime() - t1.getTime(),
  };

  const [m, n] = [(page - 1) * DOCUMENTS_PER_PAGE, page * DOCUMENTS_PER_PAGE];

  res.json({
    counts,
    times,
    flawLevels: serializeFlawLevels(buildOptions.flawLevels),
    documents: documents.slice(m, n),
  });
};
