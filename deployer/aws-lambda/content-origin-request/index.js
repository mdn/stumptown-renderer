const sanitizeFilename = require("sanitize-filename");
const { resolveFundamental } = require("@yari-internal/fundamental-redirects");
const { DEFAULT_LOCALE, VALID_LOCALES } = require("@yari-internal/constants");
const acceptLanguageParser = require("accept-language-parser");

const CONTENT_DEVELOPMENT_DOMAIN = ".content.dev.mdn.mozit.cloud";

const VALID_LOCALES_LIST = [...VALID_LOCALES.values()];

function getLocale(request, fallback = DEFAULT_LOCALE) {
  // Do we want to support a language cookie? Add it here!
  // Each header in request.headers is always a list of objects.
  const acceptLangHeaders = request.headers["accept-language"];
  const { value = null } = (acceptLangHeaders && acceptLangHeaders[0]) || {};
  const locale =
    value &&
    acceptLanguageParser.pick(VALID_LOCALES_LIST, value, { loose: true });
  return locale || fallback;
}

/*
 * NOTE: This function is derived from the function of the same name within
 *       ../../content/utils.js. It differs only in its final "join", which
 *       uses "/", as required by S3 keys, rather than "path.sep".
 */
function slugToFolder(slug) {
  return slug
    .replace(/\*/g, "_star_")
    .replace(/::/g, "_doublecolon_")
    .replace(/:/g, "_colon_")
    .replace(/\?/g, "_question_")
    .toLowerCase()
    .split("/")
    .map(sanitizeFilename)
    .join("/");
}

function redirect(location, { status = 302, cacheControlSeconds = 0 } = {}) {
  /*
   * Create and return a redirect response.
   */
  let statusDescription, cacheControlValue;
  if (status === 301) {
    statusDescription = "Moved Permanently";
  } else {
    statusDescription = "Found";
  }
  if (cacheControlSeconds) {
    cacheControlValue = `max-age=${cacheControlSeconds},public`;
  } else {
    cacheControlValue = "no-store";
  }
  return {
    status,
    statusDescription,
    headers: {
      location: [
        {
          key: "Location",
          value: location,
        },
      ],
      "cache-control": [
        {
          key: "Cache-Control",
          value: cacheControlValue,
        },
      ],
    },
  };
}

exports.handler = async (event, _context) => {
  /*
   * Modify the request before it's passed to the S3 origin.
   */
  const request = event.Records[0].cf.request;
  const host = request.headers.host[0].value.toLowerCase();

  const { url, status } = resolveFundamental(request.uri);
  if (url) {
    return redirect(url, {
      status,
      cacheControlSeconds: 3600 * 24 * 30,
    });
  }

  // Starting with /docs/ or empty path (/) should redirect to a locale.
  // Also trim a trailing slash to avoid a double redirect.
  if (
    request.uri.startsWith("/docs/") ||
    request.uri === "/" ||
    request.uri === ""
  ) {
    const path = request.uri.endsWith("/")
      ? request.uri.slice(0, -1)
      : request.uri;
    const locale = getLocale(request);
    return redirect(`/${locale}${path}`);
  }

  // A document URL with a trailing slash should redirect
  // to the same URL without the trailing slash.
  if (
    request.uri.endsWith("/") &&
    request.uri.toLowerCase().includes("/docs/")
  ) {
    return redirect(request.uri.slice(0, -1), {
      status: 301,
      cacheControlSeconds: 3600 * 24 * 30,
    });
  }
  // This condition exists to accommodate AWS origin-groups, which
  // include two origins, the primary and the secondary, where the
  // secondary origin is only attempted if the primary fails. Since
  // origin groups introduce multiple origins for the same CloudFront
  // behavior, we have to ensure we only make adjustments for custom
  // S3 origins.
  if (
    request.origin.custom &&
    request.origin.custom.domainName.includes("s3")
  ) {
    // Rewrite the URI to match the keys in S3.
    // NOTE: The incoming URI should remain URI-encoded.
    request.uri = slugToFolder(request.uri);
    // Rewrite the HOST header to match the S3 bucket website domain.
    // This is required only because we're using S3 as a website, which
    // we need in order to do redirects from S3. NOTE: The origin is
    // considered a "custom" origin because we're using S3 as a website.
    request.headers.host[0].value = request.origin.custom.domainName;
    // Conditionally rewrite the path (prefix) of the origin.
    if (host.endsWith(CONTENT_DEVELOPMENT_DOMAIN)) {
      // When reviewing PR's, each PR gets its own subdomain, and
      // all of its content is prefixed with that subdomain in S3.
      request.origin.custom.path = `/${host.split(".")[0]}`;
    } else {
      request.origin.custom.path = "/main";
    }
  }
  return request;
};
