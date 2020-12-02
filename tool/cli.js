const program = require("@caporal/core").default;
const chalk = require("chalk");
const prompts = require("prompts");
const openEditor = require("open-editor");
const open = require("open");
const fs = require("fs");
const path = require("path");

const { DEFAULT_LOCALE, VALID_LOCALES } = require("../libs/constants");
const { Redirect, Document, buildURL, GitHub } = require("../content");
const { buildDocument } = require("../build");

const PORT = parseInt(process.env.SERVER_PORT || "5000");

function tryOrExit(f) {
  return async ({ options = {}, ...args }) => {
    try {
      await f({ options, ...args });
    } catch (error) {
      if (options.verbose) {
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
  .command("validate-redirects", "Check the _redirects.txt file(s)")
  .action(
    tryOrExit(({ logger }) => {
      Redirect.load(null, true);
      logger.info(chalk.green("🍾 All is well in the world of redirects 🥂"));
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
  .argument("<from>", "From-URL", {
    validator: (value) => {
      Redirect.validateFromURL(value);
      return value;
    },
  })
  .argument("<to>", "To-URL", {
    validator: (value) => {
      Redirect.validateToURL(value);
      return value;
    },
  })
  .action(
    tryOrExit(({ args, logger }) => {
      const { from, to } = args;
      const locale = from.split("/")[1];
      Redirect.add(locale, [[from, to]]);
      logger.info(chalk.green(`Saved '${from}' → '${to}'`));
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
        : await prompts({
            type: "confirm",
            message: "Proceed?",
            name: "run",
            initial: true,
          });
      if (run) {
        const removed = Document.remove(slug, locale, { recursive, redirect });
        console.log(chalk.green(`Moved ${removed.length} documents.`));
      }
    })
  )

  .command("move", "Move content to a new slug")
  .argument("<oldSlug>", "Old slug")
  .argument("<newSlug>", "New slug")
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
        : await prompts({
            type: "confirm",
            message: "Proceed?",
            name: "run",
            initial: true,
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

      if (doc.flaws) {
        const flaws = Object.values(doc.flaws)
          .map((a) => a.length || 0)
          .reduce((a, b) => a + b);
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
  .argument("<slug>", "Slug of the document in question")
  .argument("[locale]", "Locale", {
    default: DEFAULT_LOCALE,
    validator: [...VALID_LOCALES.values()],
  })
  .action(
    tryOrExit(async ({ args }) => {
      const { slug, locale } = args;
      const url = `http://localhost:${PORT}${buildURL(locale, slug)}`;
      await open(url);
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

      const flaws = Object.values(doc.flaws)
        .map((a) => a.filter((f) => f.fixable).length || 0)
        .reduce((a, b) => a + b);
      const { run } = yes
        ? { run: true }
        : await prompts({
            type: "confirm",
            message: `Proceed fixing ${flaws} flaws?`,
            name: "run",
            initial: true,
          });
      if (run) {
        buildDocument(document, { fixFlaws: true, fixFlawsVerbose: true });
      }
    })
  )

  .command("view-pr", "Preview a pull request")
  .argument("<url>", "PR-URL", {
    validator: (value) => {
      return GitHub.getPRId(value) && value;
    },
  })
  .action(
    tryOrExit(({ args }) => {
      const { url } = args;
      for (const preview of GitHub.checkoutPR(url).map(
        ({ url, slug }) =>
          `preview ${chalk.bold(slug)} → http://localhost:${PORT}${url}`
      )) {
        console.log(preview);
      }
      console.log(chalk.green(`✔ checked out PR: ${url}`));
      console.log(
        `Don't for get to run ${chalk.bold("git checkout main")} when done!`
      );
    })
  );

program.run();
