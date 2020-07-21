require("expect-puppeteer");

function testURL(pathname = "/") {
  return "http://localhost:5000" + pathname;
}

describe("Site search", () => {
  const SEARCH_SELECTOR = 'form input[type="search"]';

  test("find Foo page", async () => {
    await page.goto(testURL("/"));
    await expect(page).toFill(SEARCH_SELECTOR, "fo");
    await expect(page).toMatch("<foo>: A test tag");
    await expect(page).toClick('[aria-selected="true"]');
    // expect puppeteer does not wait for url changes implicitly, so we
    // have to make it explicit
    await page.waitForNavigation();
    // Should have been redirected too...
    await expect(page.url()).toBe(testURL("/en-US/docs/Web/Foo"));
    await expect(page).toMatchElement("h1", { text: "<foo>: A test tag" });
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

  test("should NOT get search results", async () => {
    await page.goto(testURL("/"));
    await expect(page).toFill(SEARCH_SELECTOR, "div");
    await expect(page).toMatchElement(".nothing-found", {
      text: "nothing found",
    });
  });
});
