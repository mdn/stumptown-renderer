#!/usr/bin/env node
const cli = require("caporal");
const path = require("path");

const { runChecker } = require("./checker");
const { MAX_COMPRESSION_DIFFERENCE_PERCENTAGE } = require("./constants");

cli
  .version("0.0.0")
  .option(
    "--cwd <path>",
    "Explicit current-working-directory",
    cli.PATH,
    path.join(process.cwd(), "..")
  )
  .option(
    "--max-compression-difference-percentage <amount>",
    "Max percentage for reduction after compression",
    cli.FLOAT,
    MAX_COMPRESSION_DIFFERENCE_PERCENTAGE
  )
  .option(
    "--save-compression",
    "If it can be compressed, save the result",
    cli.BOOL
  )
  .argument("[files...]", "list of files to check")
  .action((args, options) => {
    const cwd = options.cwd || process.cwd();
    const allFilePaths = args.files.map((f) => path.resolve(cwd, f));
    if (!allFilePaths.length) {
      throw new Error("no files to check");
    }
    return runChecker(allFilePaths, options).catch((error) => {
      console.error(error);
      process.exit(1);
    });
  });

cli.parse(process.argv);
