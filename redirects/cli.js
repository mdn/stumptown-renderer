#!/usr/bin/env node
const program = require("@caporal/core").default;
const chalk = require("chalk");

const { add, resolve, load } = require("../content/redirect");

program
  .version("0.0.0")
  .command("validate", "Check the _redirects.txt file(s)")
  .action(({ logger }) => {
    try {
      load(null, true);
      logger.info(chalk.green("🍾 All is well in the world of redirects 🥂"));
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })

  .command("test", "Test a URL (pathname) to see if it redirects")
  .argument("[urls...]")
  .action(({ args, logger }) => {
    try {
      for (const url of args.urls) {
        const resolved = resolve(url);
        if (resolved === url) {
          logger.info(chalk.yellow(`${url.padEnd(50)} Not a redirecting URL`));
        } else {
          logger.info(chalk.green(`${url.padEnd(50)} -> ${resolved}`));
        }
      }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })

  .command("add", "Add a new redirect")
  .option("--locale", "Which locale (defaults to 'en-US')")
  .argument("<from>", "From-URL")
  .argument("<to>", "To-URL")
  .action(({ args }) => {
    const { from, to } = args;
    throw new Error(`not implemented yet ('${from}' → '${to}')`);
  });

program.run();
