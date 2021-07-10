from pathlib import Path

import click

from . import __version__
from .constants import (
    CI,
    CONTENT_ROOT,
    CONTENT_TRANSLATED_ROOT,
    CONTENT_ARCHIVED_ROOT,
    DEFAULT_BUCKET_NAME,
    DEFAULT_BUCKET_PREFIX,
    DEFAULT_CACHE_CONTROL,
    DEFAULT_NO_PROGRESSBAR,
    DEFAULT_REPO,
    DEFAULT_GITHUB_TOKEN,
    SPEEDCURVE_DEPLOY_API_KEY,
    SPEEDCURVE_DEPLOY_SITE_ID,
    ELASTICSEARCH_URL,
)
from .update_lambda_functions import update_all
from .upload import upload_content
from .utils import log
from .whatsdeployed import dump as dump_whatsdeployed
from .speedcurve import deploy_ping as speedcurve_deploy_ping
from .analyze_pr import analyze_pr
from . import search


def validate_directory(ctx, param, value):
    if not value:
        raise click.BadParameter(f"{value!r}")
    path = Path(value)
    if not path.exists():
        raise click.BadParameter(f"{value} does not exist")
    elif not path.is_dir():
        raise click.BadParameter(f"{value} is not a directory")
    return path


def validate_optional_directory(ctx, param, value):
    if value:
        return validate_directory(ctx, param, value)


def validate_file(ctz, param, value):
    if not value:
        raise click.BadParameter(f"{value!r}")
    path = Path(value)
    if not path.exists():
        raise click.BadParameter(f"{value} does not exist")
    elif not path.is_file():
        raise click.BadParameter(f"{value} is not a file")
    return path


def validate_optional_file(ctx, param, value):
    if value:
        return validate_file(ctx, param, value)


@click.group()
@click.option(
    "--dry-run",
    default=False,
    help="Show what would be done, but don't actually do it.",
    show_default=True,
    is_flag=True,
)
@click.option(
    "--verbose",
    default=False,
    help="Be louder with stdout logging",
    show_default=True,
    is_flag=True,
)
@click.version_option(version=__version__)
@click.pass_context
def cli(ctx, **kwargs):
    ctx.ensure_object(dict)
    ctx.obj.update(kwargs)


@cli.command()
@click.argument(
    "directory",
    type=click.Path(),
    callback=validate_directory,
    default="aws-lambda",
)
@click.pass_context
def update_lambda_functions(ctx, directory):
    log.info(f"Deployer ({__version__})", bold=True)
    update_all(directory, dry_run=ctx.obj["dry_run"])


@cli.command(
    help="Create a whatsdeployed.json file "
    "by asking git for the date and commit hash of HEAD."
)
@click.option(
    "--output",
    type=click.Path(),
    help="Name of JSON file to create",
    default="whatsdeployed.json",
)
@click.argument(
    "directory",
    type=click.Path(),
    callback=validate_directory,
    default=".",
)
@click.pass_context
def whatsdeployed(ctx, directory: Path, output: str):
    dump_whatsdeployed(directory, Path(output), dry_run=ctx.obj["dry_run"])


@cli.command()
@click.option(
    "--bucket",
    help="Name of the S3 bucket",
    default=DEFAULT_BUCKET_NAME,
    show_default=True,
)
@click.option(
    "--prefix",
    help="Upload into this folder of the S3 bucket instead of its root",
    default=DEFAULT_BUCKET_PREFIX,
    show_default=True,
)
@click.option(
    "--force-refresh",
    is_flag=True,
    default=False,
    show_default=True,
    help="Forces all files to be uploaded even if they already match what is in S3",
)
@click.option(
    "--content-root",
    help="The path to the root folder of the main content (defaults to CONTENT_ROOT)",
    default=CONTENT_ROOT,
    show_default=True,
    callback=validate_optional_directory,
)
@click.option(
    "--content-translated-root",
    help="The path to the root folder of the translated content (defaults to CONTENT_TRANSLATED_ROOT)",
    default=CONTENT_TRANSLATED_ROOT,
    show_default=True,
    callback=validate_optional_directory,
)
@click.option(
    "--content-archived-root",
    help="The path to the root folder of the archived content (defaults to CONTENT_ARCHIVED_ROOT)",
    default=CONTENT_ARCHIVED_ROOT,
    show_default=True,
    callback=validate_optional_directory,
)
@click.option(
    "--no-progressbar",
    help="Don't show the progress bar",
    default=DEFAULT_NO_PROGRESSBAR,
    show_default=True,
    is_flag=True,
)
@click.option(
    "--no-redirects",
    help="Don't upload redirects from the content roots",
    default=False,
    show_default=True,
    is_flag=True,
)
@click.option(
    "--prune",
    help="Delete keys that were not uploaded this time (including those that didn't "
    "need to be uploaded)",
    default=False,
    show_default=True,
    is_flag=True,
)
@click.option(
    "--archived-files",
    help=(
        "The path to the file that lists which files are archived. "
        "(Only relevant in conjunction with --prune)"
    ),
    default=None,
    callback=validate_optional_file,
)
@click.option(
    "--default-cache-control",
    help="The default Cache-Control value used when uploading files (0 to disable)",
    default=DEFAULT_CACHE_CONTROL,
    show_default=True,
)
@click.argument("directory", type=click.Path(), callback=validate_directory)
@click.pass_context
def upload(ctx, directory: Path, **kwargs):
    log.info(f"Deployer ({__version__})", bold=True)
    content_roots = []
    if kwargs["content_root"]:
        content_roots.append(kwargs["content_root"])
    if kwargs["content_translated_root"]:
        content_roots.append(kwargs["content_translated_root"])
    if kwargs["content_archived_root"]:
        content_roots.append(kwargs["content_archived_root"])
    if not kwargs["no_redirects"] and not content_roots:
        raise Exception(
            "if you don't use --no-redirects you have to have at least one content root"
        )

    if kwargs["prune"] and not kwargs["archived_files"]:
        log.warning(
            "Warning! Running with --prune but NOT ----archived-files will "
            "possibly delete all archived content."
        )
    ctx.obj.update(kwargs)
    upload_content(directory, content_roots, ctx.obj)


@cli.command()
@click.option(
    "--prefix",
    help="What prefix was it uploaded as",
    default=None,
    show_default=True,
)
@click.option(
    "--repo",
    help="Name of the repo (e.g. mdn/content)",
    default=DEFAULT_REPO,
    show_default=True,
)
@click.option(
    "--pr-number",
    help="Number for the PR",
    default=None,
)
@click.option(
    "--github-token",
    help="Token used to post PR comments",
    default=DEFAULT_GITHUB_TOKEN,
    show_default=False,
)
@click.option(
    "--analyze-flaws",
    help="Analyze the .doc.flaws keys in the index.json files",
    default=False,
    show_default=True,
    is_flag=True,
)
@click.option(
    "--analyze-dangerous-content",
    help='Look through the built content and list "dangerous things"',
    default=False,
    show_default=True,
    is_flag=True,
)
@click.option(
    "--diff-file",
    help=(
        "The path to the file that is a diff output. "
        "(Only relevant in conjunction with --analyze-dangerous-content)"
    ),
    default=None,
    callback=validate_optional_file,
)
@click.option(
    "--max-urls",
    help=("Maximum number of URLs to show if the PR touches too many files."),
    default=100,
)
@click.argument("directory", type=click.Path(), callback=validate_directory)
@click.pass_context
def analyze_pr_build(ctx, directory: Path, **kwargs):
    log.info(f"Deployer ({__version__})", bold=True)
    ctx.obj.update(kwargs)

    actionable_options = ("prefix", "analyze_flaws", "analyze_dangerous_content")
    if not any(ctx.obj[x] for x in actionable_options):
        raise Exception("No actionable option used. ")

    combined_comment = analyze_pr(directory, ctx.obj)
    if ctx.obj["verbose"]:
        log.info("POST".center(80, "_"), "\n")
        log.info(combined_comment)
        log.info("\n", "END POST".center(80, "_"))


@cli.command()
@click.option(
    "--api-key",
    help="Deploy API key",
    default=SPEEDCURVE_DEPLOY_API_KEY,
    show_default=False,
)
@click.option(
    "--site-id",
    help="Site ID ",
    default=SPEEDCURVE_DEPLOY_SITE_ID,
    show_default=True,
)
@click.option(
    "--note",
    help="Note string to add",
    default="",
    show_default=True,
)
@click.option(
    "--detail",
    help="Detail string to add",
    default="",
    show_default=True,
)
@click.pass_context
def speedcurve_deploy(ctx, **kwargs):
    # The reason we're not throwing an error is to make it super convenient
    # to call this command, from bash, without first having to check and figure
    # out if the relevant environment variables are available.

    api_key = kwargs["api_key"]
    if not api_key:
        log.warning("SPEEDCURVE_DEPLOY_API_KEY not set or empty")
        return

    site_id = kwargs["site_id"]
    if not site_id:
        log.warning("SPEEDCURVE_DEPLOY_SITE_ID not set or empty")
        return

    log.info(f"Pinging Speedcurve Deploy API for {site_id}", bold=True)
    note = kwargs["note"]
    detail = kwargs["detail"]
    log.info(f"Speedcurve Deploy note={note!r}, detail={detail!r}")
    speedcurve_deploy_ping(
        api_key, site_id, note, detail, dry_run=ctx.obj.get("dry_run")
    )


@cli.command()
@click.option(
    "--url",
    help="Elasticsearch URL (if not env var ELASTICSEARCH_URL)",
    default=ELASTICSEARCH_URL,
    show_default=False,
)
@click.option(
    "--update",
    is_flag=True,
    help="Don't first delete the index",
    default=False,
    show_default=True,
)
@click.option(
    "--no-progressbar",
    is_flag=True,
    help="Disables the progressbar (this is true by default it env var CI==true)",
    default=CI,
    show_default=True,
)
@click.argument("buildroot", type=click.Path(), callback=validate_directory)
@click.pass_context
def search_index(ctx, buildroot: Path, **kwargs):
    url = kwargs["url"]
    if not url:
        if not ELASTICSEARCH_URL:
            # The reason we're not throwing an error is to make it super convenient
            # to call this command, from bash, without first having to check and figure
            # out if the relevant environment variables are available.
            log.warning("DEPLOYER_ELASTICSEARCH_URL or --url not set or empty")
            return
        raise Exception("url not set")
    search.index(
        buildroot,
        url,
        update=kwargs["update"],
        no_progressbar=kwargs["no_progressbar"],
    )


@cli.command()
@click.option(
    "--url",
    help="Elasticsearch URL (if not env var ELASTICSEARCH_URL)",
    default=ELASTICSEARCH_URL,
    show_default=False,
)
@click.option("--analyzer", "-a", default="text_analyzer", show_default=True)
@click.argument("text")
@click.pass_context
def search_analyze(ctx, text, analyzer, url):
    if not url:
        raise Exception("url not set")
    search.analyze(
        url,
        text,
        analyzer,
    )
