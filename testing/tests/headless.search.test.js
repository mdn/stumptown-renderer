function testURL(pathname = "/") {
  return `http://localhost:5000${pathname}`;
}

describe("Autocomplete search", () => {
  const SEARCH_SELECTOR = 'form input[type="search"]';

  beforeAll(async () => {
    // Yes, this is a cheeky implementation testing detail but it's a nice
    // sanity check that the server can respond with *something* that's
    // sensible. This "test" also helps make sense of other potentially
    // very confusing errors within the important tests themselves.
    await page.goto(testURL("/en-US/search-index.json"));
    // It's JSON but this asserts that page will be findable
    await expect(page).toMatch("<foo>: A test tag");
  });

  test("find Foo page by title search", async () => {
    await page.goto(testURL("/"));
    await expect(page).toFill(SEARCH_SELECTOR, "foo");
    await expect(page).toMatch("<foo>: A test tag");
    // There's only 1 and this clicks on the first one anyway.
    await expect(page).toClick("div.result-item");
    await page.waitForNavigation();
    await expect(page).toMatchElement("h1", { text: "<foo>: A test tag" });
    // Should have been redirected too...
    // Note! It's important that this happens *after* the `.toMatchElement`
    // on the line above because expect-puppeteer doesn't have a wait to
    // properly wait for the (pushState) URL to have changed.
    expect(page.url()).toBe(testURL("/en-US/docs/Web/Foo"));
  });

  test("find nothing by title search", async () => {
    await page.goto(testURL("/"));
    await expect(page).toFill(SEARCH_SELECTOR, "gooblyg00k");
    await expect(page).toMatchElement(".nothing-found", {
      text: "No document titles found",
    });
  });

  test("find Foo page by fuzzy-search", async () => {
    await page.goto(testURL("/"));
    await expect(page).toFill(SEARCH_SELECTOR, "/");
    await expect(page).toMatch("Fuzzy searching by URI");
    await expect(page).not.toMatchElement(".nothing-found", {
      text: "No document titles found",
    });
    await expect(page).toFill(SEARCH_SELECTOR, "/wboo");
    await expect(page).toMatch("<foo>: A test tag");
    await expect(page).toClick("div.result-item");
    await page.waitForNavigation();
    await expect(page).toMatchElement("h1", { text: "<foo>: A test tag" });
  });

  test("find nothing by fuzzy-search", async () => {
    await page.goto(testURL("/"));
    await expect(page).toFill(SEARCH_SELECTOR, "/gooblygook");
    await expect(page).toMatchElement(".nothing-found", {
      text: "No document titles found",
    });
  });

  test("input placeholder changes when focused", async () => {
    await expect(page).toMatchElement(SEARCH_SELECTOR, {
      placeholder: /Site search/,
    });
    await expect(page).toClick(SEARCH_SELECTOR);
    await expect(page).toMatchElement(SEARCH_SELECTOR, {
      placeholder: /Go ahead/,
    });
  });
});
