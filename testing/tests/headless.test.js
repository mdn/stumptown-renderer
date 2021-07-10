const { setDefaultOptions } = require("expect-puppeteer");

// The default it 500ms. It has happened and it can happen again, that sometimes
// it just takes a little longer than 500ms. Give it a healthy margin of a
// timeout so as to reduce the risk of it failing when there's nothing wrong.
setDefaultOptions({ timeout: 1500 });

function testURL(pathname = "/") {
  return `http://localhost:5000${pathname}`;
}

describe("Basic viewing of functional pages", () => {
  it("open the temporary home page", async () => {
    await page.goto(testURL("/"));
    await expect(page).toMatch("MDN Web Docs");
    await expect(page).toMatchElement("title", { text: /MDN Web Docs/ });
  });

  it("open the /en-US/docs/Web/Foo page", async () => {
    await page.goto(testURL("/en-US/docs/Web/Foo"));
    await expect(page).toMatch("<foo>: A test tag");
    await expect(page).toMatchElement(".metadata time", {
      visible: true,
    });
  });

  it("open the French /fr/docs/Web/Foo page and navigate to English", async () => {
    await page.goto(testURL("/fr/docs/Web/Foo"));
    await expect(page).toMatchElement("h1", {
      text: "<foo>: Une page de test",
    });
    await expect(page).toClick("a.view-in-english", {
      text: "View in English",
    });
    await expect(page).toMatchElement("h1", { text: "<foo>: A test tag" });
    // Should have been redirected too...
    // Note! It's important that this happens *after* the `.toMatchElement`
    // on the line above because expect-puppeteer doesn't have a wait to
    // properly wait for the (pushState) URL to have changed.
    expect(page.url()).toBe(testURL("/en-US/docs/Web/Foo/"));
  });

  it("open the /en-US/docs/Web/InteractiveExample page", async () => {
    await page.goto(testURL("/en-US/docs/Web/InteractiveExample"), {
      // Be a bit less patient with this particular page because it contains
      // an iframe, on an external URL,  which we're not particularly
      // interested in waiting for.
      waitUntil: "domcontentloaded",
    });
    await expect(page).toMatch("I Have an Interactive Example");
  });

  it("open the /en-US/docs/Learn/CSS/CSS_layout/Introduction page", async () => {
    const uri = "/en-US/docs/Learn/CSS/CSS_layout/Introduction";
    const flexSample1Uri = `${uri}/Flex/_sample_.Flex_1.html`;
    const flexSample2Uri = `${uri}/Flex/_sample_.Flex_2.html`;
    const gridSample1Uri = `${uri}/Grid/_sample_.Grid_1.html`;
    const gridSample2Uri = `${uri}/_sample_.Grid_2.html`;
    await page.goto(testURL(uri));
    await expect(page).toMatch("A Test Introduction to CSS layout");
    await expect(page).toMatchElement("h1", {
      text: "A Test Introduction to CSS layout",
    });
    await expect(page).toMatchElement("#flexbox", {
      text: "Flexbox",
    });
    await expect(page).toMatchElement(
      `iframe.sample-code-frame[src$="${flexSample1Uri}"]`
    );
    await expect(page).toMatchElement(
      `iframe.sample-code-frame[src$="${flexSample2Uri}"]`
    );
    await expect(page).toMatchElement("#grid_layout", {
      text: "Grid Layout",
    });
    await expect(page).toMatchElement(
      `iframe.sample-code-frame[src$="${gridSample1Uri}"]`
    );
    await expect(page).toMatchElement("#Grid_2 pre.css.notranslate", {
      text: /\.wrapper\s*\{\s*display:\s*grid;/,
    });
    await expect(page).toMatchElement(
      `iframe.sample-code-frame[src$="${gridSample2Uri}"]`
    );
    // Ensure that the live-sample pages were built.
    for (const sampleUri of [
      flexSample1Uri,
      flexSample2Uri,
      gridSample1Uri,
      gridSample2Uri,
    ]) {
      await page.goto(testURL(sampleUri));
      await expect(page).toMatchElement("body > div.wrapper > div.box1", {
        text: "One",
      });
      await expect(page).toMatchElement("body > div.wrapper > div.box2", {
        text: "Two",
      });
      await expect(page).toMatchElement("body > div.wrapper > div.box3", {
        text: "Three",
      });
    }
  });

  it("open the /en-US/docs/Learn/CSS/CSS_layout/Introduction/Flex page", async () => {
    const uri = "/en-US/docs/Learn/CSS/CSS_layout/Introduction/Flex";
    const flexSample1Uri = `${uri}/_sample_.Flex_1.html`;
    const flexSample2Uri = `${uri}/_sample_.Flex_2.html`;
    await page.goto(testURL(uri));
    await expect(page).toMatch("A Test Introduction to CSS Flexbox Layout");
    await expect(page).toMatchElement("h1", {
      text: "A Test Introduction to CSS Flexbox Layout",
    });
    await expect(page).toMatchElement("#flexbox", {
      text: "Flexbox",
    });
    await expect(page).toMatchElement("#Flex_1 pre.css.notranslate", {
      text: /\.wrapper\s*\{\s*display:\s*flex;\s*\}/,
    });
    await expect(page).toMatchElement(
      `iframe.sample-code-frame[src$="${flexSample1Uri}"]`
    );
    await expect(page).toMatchElement("#Flex_2 pre.css.notranslate", {
      text: /\.wrapper\s*\{\s*display:\s*flex;\s*\}.+flex:\s*1;/,
    });
    await expect(page).toMatchElement(
      `iframe.sample-code-frame[src$="${flexSample2Uri}"]`
    );
  });

  it("open the /en-US/docs/Learn/CSS/CSS_layout/Introduction/Grid page", async () => {
    const uri = "/en-US/docs/Learn/CSS/CSS_layout/Introduction/Grid";
    const gridSample1Uri = `${uri}/_sample_.Grid_1.html`;
    const gridSample2Uri = `${uri}/_sample_.Grid_2.html`;
    await page.goto(testURL(uri));
    await expect(page).toMatch("A Test Introduction to CSS Grid Layout");
    await expect(page).toMatchElement("h1", {
      text: "A Test Introduction to CSS Grid Layout",
    });
    await expect(page).toMatchElement("#grid_layout", {
      text: "Grid Layout",
    });
    await expect(page).toMatchElement("#Grid_1 pre.css.notranslate", {
      text: /\.wrapper\s*\{\s*display:\s*grid;/,
    });
    await expect(page).toMatchElement(
      `iframe.sample-code-frame[src$="${gridSample1Uri}"]`
    );
    await expect(page).toMatchElement("#Grid_2 pre.css.notranslate", {
      text: /\.wrapper\s*\{\s*display:\s*grid;.+\.box1\s*\{/,
    });
    await expect(page).toMatchElement(
      `iframe.sample-code-frame[src$="${gridSample2Uri}"]`
    );
    // Ensure that the live-sample page "gridSample2Uri" was built.
    await page.goto(testURL(gridSample2Uri));
    await expect(page).toMatchElement("body > div.wrapper > div.box1", {
      text: "One",
    });
    await expect(page).toMatchElement("body > div.wrapper > div.box2", {
      text: "Two",
    });
    await expect(page).toMatchElement("body > div.wrapper > div.box3", {
      text: "Three",
    });
  });

  it("should return to previous page on back-button press", async () => {
    await page.goto(testURL("/en-US/docs/Web/Foo"));
    await expect(page).toMatch("<foo>: A test tag");
    await expect(page).toMatchElement("h1", {
      text: "<foo>: A test tag",
    });
    // Click the parent page in the breadcrumbs
    // BUT due to some bug somewhere, you can't do
    //
    //    await expect(page).toClick("nav.breadcrumbs a")
    //
    // ...because you keep getting:
    //
    //   "Node is either not visible or not an HTMLElement"
    //
    // So, because of that, let's just do it "the pure puppeteer way."
    //
    // For more information, see
    // https://github.com/puppeteer/puppeteer/issues/2977#issuecomment-412807613
    await page.evaluate(() => {
      document.querySelector(".breadcrumbs-container a").click();
    });
    await expect(page).toMatchElement("h1", {
      text: "Web technology for developers",
    });
    expect(page.url()).toBe(testURL("/en-US/docs/Web"));
    await page.goBack();
    await expect(page).toMatchElement("h1", {
      text: "<foo>: A test tag",
    });
  });

  it("should have a semantically valid breadcrumb trail", async () => {
    await page.goto(testURL("/en-US/docs/Web/Foo"));
    // Let's not get too technical about the name of the selectors and
    // stuff but do note that the page you're on is always a valid link
    await expect(page).toMatchElement("nav a[property=item][typeof=WebPage]", {
      // Always includes a link to "self"
      text: "<foo>: A test tag",
    });
    await expect(page).toMatchElement("nav a[property=item][typeof=WebPage]", {
      // You gotta know your fixture documents
      text: "Web technology for developers",
    });
  });

  it("should say which page was not found", async () => {
    await page.goto(testURL("/en-US/docs/Doesnot/exist"));
    await expect(page).toMatch("Page not found");
    await expect(page).toMatch("/en-US/docs/Doesnot/exist could not be found");
  });

  it("should suggest the en-US equivalent on non-en-US pages not found", async () => {
    await page.goto(testURL("/ja/docs/Web/foo"));
    await expect(page).toMatch("Page not found");
    await expect(page).toMatch("/ja/docs/Web/foo could not be found");
    // Simply by swapping the "ja" for "en-US" it's able to find the index.json
    // for that slug and present a link to it.
    await expect(page).toMatch("Good news!");
    await expect(page).toMatchElement("a", {
      text: "<foo>: A test tag",
      href: "/en-US/docs/Web/Foo",
    });
  });

  it("should give the home page and see Hacks blog posts", async () => {
    await page.goto(testURL("/en-US/"));
    await expect(page).toMatch("Resources for developers, by developers.");
    await expect(page).toMatch("Hacks Blog");

    // One home page for every built locale
    await page.goto(testURL("/fr/"));
    await expect(page).toMatch("Resources for developers, by developers.");
  });

  it("should be able to switch from French to English, set a cookie, and back again", async () => {
    await page.goto(testURL("/fr/docs/Web/Foo"));
    await expect(page).toMatch("<foo>: Une page de test");
    await expect(page).toSelect('select[name="language"]', "English (US)");
    await expect(page).toClick("button", { text: "Change language" });
    await expect(page).toMatch("<foo>: A test tag");
    expect(page.url()).toBe(testURL("/en-US/docs/Web/Foo/"));

    // And change back to French
    await expect(page).toSelect('select[name="language"]', "Français");
    await expect(page).toClick("button", { text: "Change language" });
    await expect(page).toMatch("<foo>: Une page de test");
    expect(page.url()).toBe(testURL("/fr/docs/Web/Foo/"));

    // Now that you've picked a cookie, if you go to a page whose URL doesn't
    // match your preferred locale, it will automatically navigate to the locale
    // you picked.
    await page.goto(testURL("/en-us/docs/Web/Foo"));
    await expect(page).toMatch("<foo>: Une page de test");
    expect(page.url()).toBe(testURL("/fr/docs/Web/Foo/"));
    // Now delete the cookie and it should not redirect this second time.
    await page.deleteCookie({ name: "preferredlocale" });
    await page.goto(testURL("/en-US/docs/Web/Foo"));
    await expect(page).toMatch("<foo>: A test tag");
    expect(page.url()).toBe(testURL("/en-US/docs/Web/Foo/"));
  });

  it("should redirect retired locale to English (document)", async () => {
    await page.goto(testURL("/ar/docs/Web/Foo"));
    await expect(page.url()).toMatch(
      testURL("/en-US/docs/Web/Foo/?retiredLocale=ar")
    );
    await expect(page).toMatch("<foo>: A test tag");
  });

  it("should redirect retired locale to English (index.json)", async () => {
    await page.goto(testURL("/ar/docs/Web/Foo/index.json"));
    await expect(page.url()).toMatch(
      testURL("/en-US/docs/Web/Foo/index.json?retiredLocale=ar")
    );
    await expect(page).toMatch("<foo>: A test tag");
  });

  it("should redirect retired locale to English (search with query string)", async () => {
    await page.goto(testURL("/ar/search?q=video"));
    await expect(page.url()).toMatch(
      testURL("/en-US/search/?q=video&retiredLocale=ar")
    );
    await expect(page).toMatch("Search results for: video");
  });

  it("should say the locale was retired", async () => {
    await page.goto(testURL("/en-US/docs/Web/Foo/?retiredLocale=ar"));
    await expect(page).toMatch("The page you requested has been retired");
    // sanity check that it goes away
    await page.goto(testURL("/en-US/docs/Web/Foo/"));
    await expect(page).not.toMatch("The page you requested has been retired");
  });

  it("should not say the locale was retired if viewing a translated page", async () => {
    await page.goto(testURL("/fr/docs/Web/Foo/?retiredLocale=sv-SE"));
    await expect(page).not.toMatch("The page you requested has been retired");
  });
});
