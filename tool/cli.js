const fs = require("fs");
const path = require("path");

const program = require("@caporal/core").default;
const chalk = require("chalk");
const { prompt } = require("inquirer");
const openEditor = require("open-editor");
const open = require("open");
const {
  syncAllTranslatedContent,
} = require("../build/sync-translated-content");
const log = require("loglevel");
const cheerio = require("cheerio");

const { DEFAULT_LOCALE, VALID_LOCALES } = require("../libs/constants");
const {
  CONTENT_ROOT,
  CONTENT_TRANSLATED_ROOT,
  CONTENT_ARCHIVED_ROOT,
  Redirect,
  Document,
  buildURL,
  getRoot,
} = require("../content");
const { buildDocument, gatherGitHistory, buildSPAs } = require("../build");
const {
  ALWAYS_ALLOW_ROBOTS,
  BUILD_OUT_ROOT,
  GOOGLE_ANALYTICS_ACCOUNT,
  GOOGLE_ANALYTICS_DEBUG,
} = require("../build/constants");
const { runArchive } = require("./archive");
const { runMakePopularitiesFile } = require("./popularities");
const { runOptimizeClientBuild } = require("./optimize-client-build");
const { runBuildRobotsTxt } = require("./build-robots-txt");
const kumascript = require("../kumascript");

const PORT = parseInt(process.env.SERVER_PORT || "5000");

// The Google Analytics pageviews CSV file parsed, sorted (most pageviews
// first), and sliced to this number of URIs that goes into the JSON file.
// If this number is too large the resulting JSON file gets too big and
// will include very rarely used URIs.
const MAX_GOOGLE_ANALYTICS_URIS = 20000;

function tryOrExit(f) {
  return async ({ options = {}, ...args }) => {
    try {
      await f({ options, ...args });
    } catch (error) {
      if (options.verbose || options.v) {
        console.error(chalk.red(error.stack));
      }
      throw error;
    }
  };
}

program
  .bin("yarn tool")
  .name("tool")
  .version("0.0.0")
  .disableGlobalOption("--silent")
  .cast(false)
  .command("validate-redirects", "Try loading the _redirects.txt file(s)")
  .argument("[locales...]", "Locale", {
    default: [...VALID_LOCALES.keys()],
    validator: [...VALID_LOCALES.keys()],
  })
  .option("--strict", "Strict validation")
  .action(
    tryOrExit(({ args, options, logger }) => {
      const { locales } = args;
      const { strict } = options;
      let fine = true;
      if (strict) {
        for (const locale of locales) {
          try {
            Redirect.validateLocale(locale, strict);
            logger.info(chalk.green(`✓ redirects for ${locale} looking good!`));
          } catch (e) {
            logger.info(
              chalk.red(`_redirects.txt for ${locale} is causing issues: ${e}`)
            );
            fine = false;
          }
        }
      } else {
        try {
          Redirect.load(locales, true);
        } catch (e) {
          logger.info(chalk.red(`Unable to load redirects: ${e}`));
          fine = false;
        }
      }
      if (fine) {
        logger.info(chalk.green("🍾 All is well in the world of redirects 🥂"));
      } else {
        throw new Error("🔥 Errors loading redirects 🔥");
      }
    })
  )

  .command("test-redirects", "Test URLs (pathnames) to see if they redirect")
  .argument("[urls...]", "URLs to test")
  .action(
    tryOrExit(({ args, logger }) => {
      for (const url of args.urls) {
        const resolved = Redirect.resolve(url);
        if (resolved === url) {
          logger.info(chalk.yellow(`${url.padEnd(50)} Not a redirecting URL`));
        } else {
          logger.info(chalk.green(`${url.padEnd(50)} -> ${resolved}`));
        }
      }
    })
  )

  .command("add-redirect", "Add a new redirect")
  .argument("<from>", "From-URL")
  .argument("<to>", "To-URL")
  .action(
    tryOrExit(({ args, logger }) => {
      const { from, to } = args;
      const locale = from.split("/")[1];
      Redirect.add(locale, [[from, to]]);
      logger.info(chalk.green(`Saved '${from}' → '${to}'`));
    })
  )

  .command("fix-redirects", "Consolidate/fix redirects")
  .argument("<locales...>", "Locale", {
    default: [DEFAULT_LOCALE],
    validator: [...VALID_LOCALES.values(), ...VALID_LOCALES.keys()],
  })
  .action(
    tryOrExit(({ args, logger }) => {
      const { locales } = args;
      for (const locale of locales) {
        Redirect.add(locale.toLowerCase(), [], { fix: true, strict: true });
        logger.info(chalk.green(`Fixed ${locale}`));
      }
    })
  )

  .command("delete", "Delete content")
  .argument("<slug>", "Slug")
  .argument("[locale]", "Locale", {
    default: DEFAULT_LOCALE,
    validator: [...VALID_LOCALES.values()],
  })
  .option("-r, --recursive", "Delete content recursively", { default: false })
  .option("--redirect <redirect>", "Redirect document to <redirect>")
  .option("-y, --yes", "Assume yes", { default: false })
  .action(
    tryOrExit(async ({ args, options }) => {
      const { slug, locale } = args;
      const { recursive, redirect, yes } = options;
      const changes = Document.remove(slug, locale, {
        recursive,
        redirect,
        dry: true,
      });
      console.log(chalk.green(`Will remove ${changes.length} documents:`));
      console.log(chalk.red(changes.join("\n")));
      if (redirect) {
        console.log(chalk.green(`redirecting to: ${redirect}`));
      }
      const { run } = yes
        ? { run: true }
        : await prompt({
            type: "confirm",
            message: "Proceed?",
            name: "run",
            default: true,
          });
      if (run) {
        const removed = Document.remove(slug, locale, { recursive, redirect });
        console.log(chalk.green(`Moved ${removed.length} documents.`));
      }
    })
  )

  .command("move", "Move content to a new slug")
  .argument("<oldSlug>", "Old slug")
  .argument("<newSlug>", "New slug", {
    validator: (value) => {
      if (value.includes("#")) {
        throw new Error("slug can not contain the '#' character");
      }
      return value;
    },
  })
  .argument("[locale]", "Locale", {
    default: DEFAULT_LOCALE,
    validator: [...VALID_LOCALES.values()],
  })
  .option("-y, --yes", "Assume yes", { default: false })
  .action(
    tryOrExit(async ({ args, options }) => {
      const { oldSlug, newSlug, locale } = args;
      const { yes } = options;
      const changes = Document.move(oldSlug, newSlug, locale, {
        dry: true,
      });
      console.log(
        chalk.green(
          `Will move ${changes.length} documents from ${oldSlug} to ${newSlug} for ${locale}`
        )
      );
      console.log(
        changes
          .map(([from, to]) => `${chalk.red(from)} → ${chalk.green(to)}`)
          .join("\n")
      );
      const { run } = yes
        ? { run: true }
        : await prompt({
            type: "confirm",
            message: "Proceed?",
            name: "run",
            default: true,
          });
      if (run) {
        const moved = Document.move(oldSlug, newSlug, locale);
        console.log(chalk.green(`Moved ${moved.length} documents.`));
      }
    })
  )

  .command("edit", "Spawn your EDITOR for an existing slug")
  .argument("<slug>", "Slug of the document in question")
  .argument("[locale]", "Locale", {
    default: DEFAULT_LOCALE,
    validator: [...VALID_LOCALES.values()],
  })
  .action(
    tryOrExit(({ args }) => {
      const { slug, locale } = args;
      if (!Document.exists(slug, locale)) {
        throw new Error(`${slug} does not exists for ${locale}`);
      }
      const filePath = Document.fileForSlug(slug, locale);
      openEditor([filePath]);
    })
  )

  .command("create", "Spawn your Editor for a new slug")
  .argument("<slug>", "Slug of the document in question")
  .argument("[locale]", "Locale", {
    default: DEFAULT_LOCALE,
    validator: [...VALID_LOCALES.values()],
  })
  .action(
    tryOrExit(({ args }) => {
      const { slug, locale } = args;
      const parentSlug = Document.parentSlug(slug);
      if (!Document.exists(parentSlug, locale)) {
        throw new Error(`Parent ${parentSlug} does not exists for ${locale}`);
      }
      if (Document.exists(slug, locale)) {
        throw new Error(`${slug} already exists for ${locale}`);
      }
      const filePath = Document.fileForSlug(slug, locale);
      fs.mkdirSync(path.basename(filePath), { recursive: true });
      openEditor([filePath]);
    })
  )

  .command("validate", "Validate a document")
  .argument("<slug>", "Slug of the document in question")
  .argument("[locale]", "Locale", {
    default: DEFAULT_LOCALE,
    validator: [...VALID_LOCALES.values()],
  })
  .action(
    tryOrExit(async ({ args }) => {
      const { slug, locale } = args;
      let okay = true;
      const document = Document.findByURL(buildURL(locale, slug));
      if (!document) {
        throw new Error(`Slug ${slug} does not exist for ${locale}`);
      }
      const { doc } = await buildDocument(document);

      const flaws = Object.values(doc.flaws || {})
        .map((a) => a.length || 0)
        .reduce((a, b) => a + b, 0);
      if (flaws > 0) {
        console.log(chalk.red(`Found ${flaws} flaws.`));
        okay = false;
      }
      try {
        Document.validate(slug, locale);
      } catch (e) {
        console.log(chalk.red(e));
        okay = false;
      }
      if (okay) {
        console.log(chalk.green("✓ All seems fine"));
      }
    })
  )

  .command("preview", "Open a preview of a slug")
  .option("-p, --port <port>", "Port for your localhost hostname", {
    default: PORT,
  })
  .option("-h, --hostname <hostname>", "Hostname for your local server", {
    default: "localhost",
  })
  .argument("<slug>", "Slug (or path) of the document in question")
  .argument("[locale]", "Locale", {
    default: DEFAULT_LOCALE,
    validator: [...VALID_LOCALES.values()],
  })
  .action(
    tryOrExit(async ({ args, options }) => {
      const { slug, locale } = args;
      const { hostname, port } = options;
      let url;
      // Perhaps they typed in a path relative to the content root
      if (
        (slug.startsWith("files") || fs.existsSync(slug)) &&
        (slug.endsWith("index.html") || slug.endsWith("index.md"))
      ) {
        if (
          fs.existsSync(slug) &&
          slug.includes("translated-content") &&
          !CONTENT_TRANSLATED_ROOT
        ) {
          // Such an easy mistake to make that you pass it a file path
          // that comes from the translated-content repo but forgot to
          // set the environment variable first.
          console.warn(
            chalk.yellow(
              `Did you forget to set the environment variable ${chalk.bold(
                "CONTENT_TRANSLATED_ROOT"
              )}?`
            )
          );
        }
        const slugSplit = slug
          .replace(CONTENT_ROOT, "")
          .replace(CONTENT_TRANSLATED_ROOT ? CONTENT_TRANSLATED_ROOT : "", "")
          .split(path.sep);
        const document = Document.read(
          // Remove that leading 'files' and the trailing 'index.(html|md)'
          slugSplit.slice(1, -1).join(path.sep)
        );
        if (document) {
          url = document.url;
        }
      } else if (
        slug.includes(BUILD_OUT_ROOT) &&
        fs.existsSync(slug) &&
        fs.existsSync(path.join(slug, "index.json"))
      ) {
        // Someone probably yarn `yarn build` and copy-n-pasted one of the lines
        // it spits out from its CLI.
        const { doc } = JSON.parse(
          fs.readFileSync(path.join(slug, "index.json"))
        );
        if (doc) {
          url = doc.mdn_url;
        }
      } else {
        try {
          const parsed = new URL(slug);
          url = parsed.pathname + parsed.hash;
        } catch (err) {
          // If the `new URL()` constructor fails, it's probably not a URL
        }
        if (!url) {
          url = buildURL(locale, slug);
        }
      }

      if (!url) {
        throw new Error(`Unable to turn '${slug}' into an absolute URL`);
      }
      const absoluteURL = `http://${hostname}:${port}${url}`;
      await open(absoluteURL);
    })
  )

  .command(
    "gather-git-history",
    "Extract all last-modified dates from the git logs"
  )
  .option("--save-history <path>", "File to save all previous history")
  .option("--load-history <path>", "Optional file to load all previous history")
  .action(
    tryOrExit(async ({ options }) => {
      const { saveHistory, loadHistory, verbose } = options;
      if (loadHistory) {
        if (fs.existsSync(loadHistory)) {
          console.log(
            chalk.yellow(`Reusing existing history from ${loadHistory}`)
          );
        }
      }
      const roots = [CONTENT_ROOT];
      if (CONTENT_TRANSLATED_ROOT) {
        roots.push(CONTENT_TRANSLATED_ROOT);
      }
      const map = gatherGitHistory(
        roots,
        loadHistory && fs.existsSync(loadHistory) ? loadHistory : null
      );
      const historyPerLocale = {};

      // Someplace to put the map into an object so it can be saved into `saveHistory`
      const allHistory = {};
      for (const [relPath, value] of map) {
        const locale = relPath.split(path.sep)[0];
        if (!VALID_LOCALES.has(locale)) {
          continue;
        }
        allHistory[relPath] = value;
        if (!historyPerLocale[locale]) {
          historyPerLocale[locale] = {};
        }
        historyPerLocale[locale][relPath] = value;
      }
      let filesWritten = 0;
      for (const [locale, history] of Object.entries(historyPerLocale)) {
        const root = getRoot(locale);
        const outputFile = path.join(root, locale, "_githistory.json");
        fs.writeFileSync(outputFile, JSON.stringify(history, null, 2), "utf-8");
        filesWritten += 1;
        if (verbose) {
          console.log(
            chalk.green(
              `Wrote '${locale}' ${Object.keys(
                history
              ).length.toLocaleString()} paths into ${outputFile}`
            )
          );
        }
      }
      console.log(chalk.green(`Wrote ${filesWritten} _githistory.json files`));
      if (saveHistory) {
        fs.writeFileSync(
          saveHistory,
          JSON.stringify(allHistory, null, 2),
          "utf-8"
        );
        console.log(
          chalk.green(
            `Saved ${Object.keys(
              allHistory
            ).length.toLocaleString()} paths into ${saveHistory}`
          )
        );
      }
    })
  )

  .command(
    "sync-translated-content",
    "Sync translated content (sync with en-US slugs) for a locale"
  )
  .argument("<locale...>", "Locale", {
    default: [...VALID_LOCALES.keys()].filter((l) => l !== "en-us"),
    validator: [...VALID_LOCALES.keys()].filter((l) => l !== "en-us"),
  })
  .action(
    tryOrExit(async ({ args, options }) => {
      const { locale } = args;
      const { verbose } = options;
      if (verbose) {
        log.setDefaultLevel(log.levels.DEBUG);
      }
      for (const l of locale) {
        const {
          movedDocs,
          conflictingDocs,
          orphanedDocs,
          redirectedDocs,
          totalDocs,
        } = syncAllTranslatedContent(l);
        console.log(chalk.green(`Syncing ${l}:`));
        console.log(chalk.green(`Total of ${totalDocs} documents`));
        console.log(chalk.green(`Moved ${movedDocs} documents`));
        console.log(chalk.green(`Conflicting ${conflictingDocs} documents.`));
        console.log(chalk.green(`Orphaned ${orphanedDocs} documents.`));
        console.log(
          chalk.green(`Fixed ${redirectedDocs} redirected documents.`)
        );
      }
    })
  )

  .command("flaws", "Find (and fix) flaws in a document")
  .argument("<slug>", "Slug of the document in question")
  .argument("[locale]", "Locale", {
    default: DEFAULT_LOCALE,
    validator: [...VALID_LOCALES.values()],
  })
  .option("-y, --yes", "Assume yes", { default: false })
  .action(
    tryOrExit(async ({ args, options }) => {
      const { slug, locale } = args;
      const { yes } = options;
      const document = Document.findByURL(buildURL(locale, slug));
      if (!document) {
        throw new Error(`Slug ${slug} does not exist for ${locale}`);
      }
      const { doc } = await buildDocument(document, {
        fixFlaws: true,
        fixFlawsDryRun: true,
      });

      const flaws = Object.values(doc.flaws || {})
        .map((a) => a.filter((f) => f.fixable).length || 0)
        .reduce((a, b) => a + b, 0);
      if (flaws === 0) {
        console.log(chalk.green("Found no fixable flaws!"));
        return;
      }
      const { run } = yes
        ? { run: true }
        : await prompt({
            type: "confirm",
            message: `Proceed fixing ${flaws} flaws?`,
            name: "run",
            default: true,
          });
      if (run) {
        buildDocument(document, { fixFlaws: true, fixFlawsVerbose: true });
      }
    })
  )

  .command("redundant-translations", "Find redundant translations")
  .action(
    tryOrExit(async () => {
      if (!CONTENT_TRANSLATED_ROOT) {
        throw new Error("CONTENT_TRANSLATED_ROOT not set");
      }
      if (!fs.existsSync(CONTENT_TRANSLATED_ROOT)) {
        throw new Error(`${CONTENT_TRANSLATED_ROOT} does not exist`);
      }
      const documents = Document.findAll();
      if (!documents.count) {
        throw new Error("No documents to analyze");
      }
      // Build up a map of translations by their `translation_of`
      const map = new Map();
      for (const document of documents.iter()) {
        if (!document.isTranslated) continue;
        const { translation_of, locale } = document.metadata;
        if (!map.has(translation_of)) {
          map.set(translation_of, new Map());
        }
        if (!map.get(translation_of).has(locale)) {
          map.get(translation_of).set(locale, []);
        }
        map
          .get(translation_of)
          .get(locale)
          .push(
            Object.assign(
              { filePath: document.fileInfo.path },
              document.metadata
            )
          );
      }
      // Now, let's investigate those with more than 1
      let sumENUS = 0;
      let sumTotal = 0;
      for (const [translation_of, localeMap] of map) {
        for (const [, metadatas] of localeMap) {
          if (metadatas.length > 1) {
            // console.log(translation_of, locale, metadatas);
            sumENUS++;
            sumTotal += metadatas.length;
            console.log(
              `https://developer.allizom.org/en-US/docs/${translation_of}`
            );
            for (const metadata of metadatas) {
              console.log(metadata);
            }
          }
        }
      }
      console.warn(
        `${sumENUS} en-US documents have multiple translations with the same locale`
      );
      console.log(
        `In total, ${sumTotal} translations that share the same translation_of`
      );
    })
  )

  .command("archive", "Render and copy to archived-content repo")
  .option("--remove", "Also delete from active repos", { default: false })
  .option(
    "--redirect-to-github",
    "Put in a redirect to browsing it on github.com/mdn/archived-content",
    {
      default: false,
    }
  )
  .argument("<slugs...>", "slug trees (e.g. 'Mozilla/Virtualenv')")
  .action(
    tryOrExit(async ({ args, options, logger }) => {
      if (!CONTENT_ARCHIVED_ROOT) {
        throw new Error("CONTENT_ARCHIVED_ROOT not set");
      }
      if (!CONTENT_TRANSLATED_ROOT) {
        throw new Error("CONTENT_TRANSLATED_ROOT not set");
      }
      const { slugs } = args;
      const { verbose } = options;
      const archivedResults = await runArchive(slugs, options);
      if (verbose) {
        for (const result of archivedResults) {
          // console.log(result);
          logger.info(
            `${chalk.grey(result.document.fileInfo.path)} --> ${chalk.green(
              result.folderPath
            )} ${result.removed ? chalk.yellow(" also removed!") : ""}`
          );
        }
      } else {
        logger.info(`Archived ${archivedResults.length} documents`);
      }
    })
  )

  .command(
    "unarchive",
    "Move content from CONTENT_ARCHIVED_ROOT to CONTENT_ROOT"
  )
  .option("--foldersearch <pattern>", "simple pattern for folders", {
    default: "",
  })
  .option("--move", "(git) delete from archive repo", { default: false })
  .argument("[files...]", "specific files")
  .action(
    tryOrExit(async ({ args, options }) => {
      if (!CONTENT_ARCHIVED_ROOT) {
        throw new Error("CONTENT_ARCHIVED_ROOT not set");
      }
      if (!CONTENT_TRANSLATED_ROOT) {
        throw new Error("CONTENT_TRANSLATED_ROOT not set");
      }
      const { files } = args;
      const { foldersearch, move } = options;
      if (!foldersearch && !files) {
        throw new Error("Must specify either files or --foldersearch pattern");
      }
      const filters = {
        folderSearch: foldersearch || null,
        files: new Set(files || []),
      };
      const documents = Document.findAll(filters);
      if (!documents.count) {
        throw new Error("No documents found");
      }
      let countCreated = 0;
      for (const document of documents.iter()) {
        console.assert(document.isArchive, document.fileInfo);
        console.assert(!document.isTranslated, document.fileInfo);
        if (document.metadata.locale !== "en-US") {
          continue;
        }
        const created = Document.unarchive(document, move);
        console.log(`Created ${created}`);
        countCreated++;
      }
      console.log(`Created ${countCreated} new files`);
    })
  )

  .command(
    "popularities",
    "Convert an AWS Athena log aggregation CSV into a popularities.json file"
  )
  .option("--outfile <path>", "output file", {
    default: path.join(CONTENT_ROOT, "popularities.json"),
  })
  .option("--max-uris <number>", "limit to top <number> entries", {
    default: MAX_GOOGLE_ANALYTICS_URIS,
  })
  .action(
    tryOrExit(async ({ options, logger }) => {
      const { rowCount, popularities, pageviews } =
        await runMakePopularitiesFile(options);
      logger.info(chalk.green(`Parsed ${rowCount.toLocaleString()} rows.`));

      const numberKeys = Object.keys(popularities).length;
      logger.info(
        chalk.green(`Wrote ${numberKeys.toLocaleString()} pages' popularities.`)
      );

      logger.debug("25 most popular URIs...");
      pageviews.slice(0, 25).forEach(([uri, popularity], i) => {
        logger.debug(
          `${`${i}`.padEnd(2)} ${uri.padEnd(75)} ${popularity.toFixed(5)}`
        );
      });
      function fmtBytes(bytes) {
        return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
      }
      logger.info(
        chalk.green(
          `${options.outfile} is ${fmtBytes(fs.statSync(options.outfile).size)}`
        )
      );
    })
  )

  .command(
    "google-analytics-code",
    "Generate a .js file that can be used in SSR rendering"
  )
  .option("--outfile <path>", "name of the generated script file", {
    default: path.join(BUILD_OUT_ROOT, "static", "js", "ga.js"),
  })
  .option(
    "--debug",
    "whether to use the Google Analytics debug file (defaults to value of $GOOGLE_ANALYTICS_DEBUG)",
    {
      default: GOOGLE_ANALYTICS_DEBUG,
    }
  )
  .option(
    "--account <id>",
    "Google Analytics account ID (defaults to value of $GOOGLE_ANALYTICS_ACCOUNT)",
    {
      default: GOOGLE_ANALYTICS_ACCOUNT,
    }
  )
  .action(
    tryOrExit(async ({ options, logger }) => {
      const { outfile, debug, account } = options;
      if (account) {
        const dntHelperCode = fs
          .readFileSync(
            path.join(__dirname, "mozilla.dnthelper.min.js"),
            "utf-8"
          )
          .trim();

        const gaScriptURL = `https://www.google-analytics.com/${
          debug ? "analytics_debug" : "analytics"
        }.js`;

        const code = `
// Mozilla DNT Helper
${dntHelperCode}
// only load GA if DNT is not enabled
if (Mozilla && !Mozilla.dntEnabled()) {
    window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
    ga('create', '${account}', 'mozilla.org');
    ga('set', 'anonymizeIp', true);
    ga('send', 'pageview');

    var gaScript = document.createElement('script');
    gaScript.async = 1; gaScript.src = '${gaScriptURL}';
    document.head.appendChild(gaScript);
}`.trim();
        fs.writeFileSync(outfile, `${code}\n`, "utf-8");
        logger.info(
          chalk.green(
            `Generated ${outfile} for SSR rendering using ${account}${
              debug ? " (debug mode)" : ""
            }.`
          )
        );
      } else {
        logger.info(chalk.yellow("No Google Analytics code file generated"));
      }
    })
  )

  .command(
    "build-robots-txt",
    "Generate a robots.txt in the build root depending ALWAYS_ALLOW_ROBOTS"
  )
  .option("--outfile <path>", "name of the generated file", {
    default: path.join(BUILD_OUT_ROOT, "robots.txt"),
  })
  .action(
    tryOrExit(async ({ options, logger }) => {
      const { outfile } = options;
      await runBuildRobotsTxt(outfile);
      logger.info(
        chalk.yellow(
          `Generated ${path.relative(
            ".",
            outfile
          )} based on ALWAYS_ALLOW_ROBOTS=${ALWAYS_ALLOW_ROBOTS}`
        )
      );
    })
  )

  .command("spas", "Build (SSR) all the skeleton apps for single page apps")
  .action(
    tryOrExit(async ({ options }) => {
      await buildSPAs(options);
    })
  )

  .command(
    "macros",
    "Render and/or remove one or more macros from one or more documents"
  )
  .option("-f, --force", "Render even if there are non-fixable flaws", {
    default: false,
  })
  .argument("<cmd>", 'must be either "render" or "remove"')
  .argument("<foldersearch>", "folder of documents to target")
  .argument("<macros...>", "one or more macro names")
  .action(
    tryOrExit(async ({ args, options }) => {
      if (!CONTENT_ROOT) {
        throw new Error("CONTENT_ROOT not set");
      }
      if (!CONTENT_TRANSLATED_ROOT) {
        throw new Error("CONTENT_TRANSLATED_ROOT not set");
      }
      const { force } = options;
      const { cmd, foldersearch, macros } = args;
      const cmdLC = cmd.toLowerCase();
      if (!["render", "remove"].includes(cmdLC)) {
        throw new Error(`invalid macros command "${cmd}"`);
      }
      console.log(
        `${cmdLC} the macro(s) ${macros
          .map((m) => `"${m}"`)
          .join(", ")} within content folder(s) matching "${foldersearch}"`
      );
      const documents = Document.findAll({
        folderSearch: foldersearch,
        quiet: true,
      });
      if (!documents.count) {
        throw new Error("no documents found");
      }

      async function renderOrRemoveMacros(document) {
        try {
          return await kumascript.render(document.url, {
            invalidateCache: true,
            selective_mode: [cmdLC, macros],
          });
        } catch (error) {
          if (error.name === "MacroInvocationError") {
            error.updateFileInfo(document.fileInfo);
            throw new Error(
              `error trying to parse ${error.filepath}, line ${error.line} column ${error.column} (${error.error.message})`
            );
          }
          // Any other unexpected error re-thrown.
          throw error;
        }
      }

      let countTotal = 0;
      let countSkipped = 0;
      let countModified = 0;
      let countNoChange = 0;
      for (const document of documents.iter()) {
        countTotal++;
        console.group(`${document.fileInfo.path}:`);
        const originalRawBody = document.rawBody;
        let [renderedHTML, flaws] = await renderOrRemoveMacros(document);
        if (flaws.length) {
          const fixableFlaws = flaws.filter((f) => f.redirectInfo);
          const nonFixableFlaws = flaws.filter((f) => !f.redirectInfo);
          const nonFixableFlawNames = [
            ...new Set(nonFixableFlaws.map((f) => f.name)).values(),
          ].join(", ");
          if (force || nonFixableFlaws.length === 0) {
            // They're all fixable or we don't care if some or all are
            // not, but let's at least fix any that we can.
            if (nonFixableFlaws.length > 0) {
              console.log(
                `ignoring ${nonFixableFlaws.length} non-fixable flaw(s) (${nonFixableFlawNames})`
              );
            }
            if (fixableFlaws.length) {
              console.group(
                `fixing ${fixableFlaws.length} fixable flaw(s) before proceeding:`
              );
              // Let's start fresh so we don't keep the "data-flaw-src"
              // attributes that may have been injected during the rendering.
              document.rawBody = originalRawBody;
              for (const flaw of fixableFlaws) {
                const suggestion = flaw.macroSource.replace(
                  flaw.redirectInfo.current,
                  flaw.redirectInfo.suggested
                );
                document.rawBody = document.rawBody.replace(
                  flaw.macroSource,
                  suggestion
                );
                console.log(`${flaw.macroSource} --> ${suggestion}`);
              }
              console.groupEnd();
              Document.update(
                document.url,
                document.rawBody,
                document.metadata
              );
              // Ok, we've fixed the fixable flaws, now let's render again.
              [renderedHTML, flaws] = await renderOrRemoveMacros(document);
            }
          } else {
            // There are one or more flaws that we can't fix, and we're not
            // going to ignore them, so let's skip this document.
            console.log(
              `skipping, has ${nonFixableFlaws.length} non-fixable flaw(s) (${nonFixableFlawNames})`
            );
            console.groupEnd();
            countSkipped++;
            continue;
          }
        }
        // The Kumascript rendering wraps the result with a "body" tag
        // (and more), so let's extract the HTML content of the "body"
        // to get what we'll store in the document.
        const $ = cheerio.load(renderedHTML);
        const newRawHTML = $("body").html();
        if (newRawHTML !== originalRawBody) {
          Document.update(document.url, newRawHTML, document.metadata);
          console.log(`modified`);
          countModified++;
        } else {
          console.log(`no change`);
          countNoChange++;
        }
        console.groupEnd();
      }
      console.log(
        `modified: ${countModified} | no-change: ${countNoChange} | skipped: ${countSkipped} | total: ${countTotal}`
      );
    })
  )

  .command(
    "optimize-client-build",
    "After the client code has been built there are things to do that react-scripts can't."
  )
  .argument("<buildroot>", "directory where react-scripts built", {
    default: path.join("client", "build"),
  })
  .action(
    tryOrExit(async ({ args, options, logger }) => {
      const { buildroot } = args;
      const { results } = await runOptimizeClientBuild(buildroot);
      if (options.verbose) {
        for (const result of results) {
          logger.info(`${result.filePath} -> ${result.hashedHref}`);
        }
      } else {
        logger.info(
          chalk.green(
            `Hashed ${results.length} files in ${path.join(
              buildroot,
              "index.html"
            )}`
          )
        );
      }
    })
  );

program.run();
