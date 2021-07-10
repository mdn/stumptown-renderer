const { DEFAULT_LOCALE } = require("../../libs/constants");
const { Document } = require("../../content");

function setURLFromSlug(related, baseURL) {
  for (const content of related) {
    if (content.slug && !content.url) {
      content.url = `${baseURL}/${content.slug}`;
      delete content.slug;
    }
    if (content.content) {
      setURLFromSlug(content.content, baseURL);
    }
  }
}

function setTitleFromURL(related, locale, debug = false) {
  for (const content of related) {
    if (content.url) {
      let doc = Document.findByURL(content.url);
      let fallback = false;
      if (!doc && locale !== DEFAULT_LOCALE) {
        doc = Document.findByURL(
          content.url.replace(`/${locale}/`, `/${DEFAULT_LOCALE}/`)
        );
        fallback = true;
      }
      if (doc) {
        if (!content.title) {
          content.title = doc.metadata.title;
        }
        if (fallback) {
          content.fallback = DEFAULT_LOCALE;
          content.url = doc.url;
        }
      } else if (!content.url.startsWith("http")) {
        if (!content.title) {
          content.title = "Document not found";
        }
        console.warn(`Can't find a document by URL ${content.url}`);
        content.notFound = true;
      }

      // This is only for local development where you want to find out
      // if the set title is the same here in the table of `texts` as
      // the document itself.
      if (debug && doc) {
        if (content.title === doc.metadata.title) {
          console.log(`For '${content.url}' the document's title is the same`);
        } else {
          console.log(
            `For '${content.url}': the document's title is different from the texts: '${content.title}' != '${doc.metadata.title}'`
          );
        }
      }
    }

    if (content.content) {
      setTitleFromURL(content.content, locale, debug);
    }
  }
}

function setActive(related, url) {
  let foundActive = false;
  for (const content of related) {
    if (content.url && content.url.split("#")[0] === url) {
      content.isActive = true;
      foundActive = true;
    } else if (content.content) {
      if (setActive(content.content, url)) {
        content.containsActive = true;
      }
    }
  }
  return foundActive;
}

module.exports = {
  setURLFromSlug,
  setTitleFromURL,
  setActive,
};
