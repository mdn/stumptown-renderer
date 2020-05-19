import React from "react";
const { render, fireEvent, waitFor } = require("@testing-library/react");
import { MemoryRouter } from "react-router-dom";
import { SearchWidget } from "./search";

declare var global: Window;

function renderWithRouter(component) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}

it("renders without crashing", () => {
  const { getByPlaceholderText } = renderWithRouter(<SearchWidget />);
  expect(getByPlaceholderText(/Site search/)).toBeDefined();
});

describe("Tests using XHR", () => {
  beforeEach(() => {
    // Mock Fetch API
    jest.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        status: 200,
        ok: true,
        json: () =>
          Promise.resolve({
            titles: {
              "/docs/Web/HTML/Element/abbr": {
                title: "<abbr>: The Abbreviation element",
                popularity: 0.0,
              },
            },
          }),
      } as Response)
    );
    (global.fetch as any).mockClear();
  });

  test("input placeholder changes when focused", async () => {
    const { getByPlaceholderText } = renderWithRouter(<SearchWidget />);
    const input = getByPlaceholderText(/Site search/);
    fireEvent.focus(input);
    expect(getByPlaceholderText(/Initializing/));
    await waitFor(() => getByPlaceholderText(/Go ahead/));
  });

  test("XHR request on focusing input the first time", () => {
    const { getByPlaceholderText } = renderWithRouter(<SearchWidget />);
    const input = getByPlaceholderText(/Site search/);
    // Fire initial focus event
    fireEvent.focus(input);
    // Expect XHR
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Clear the mock fetch
    (global.fetch as any).mockClear();
    // Fire focus event again to ensure it's not called again
    fireEvent.focus(input);
    expect(global.fetch).toHaveBeenCalledTimes(0);
  });

  test("should set titles in localStorage", async () => {
    const { getByPlaceholderText } = renderWithRouter(<SearchWidget />);
    const input = getByPlaceholderText(/Site search/);
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    expect(global.localStorage.getItem("titles")).toBeDefined();
  });

  test("should NOT get search results", async () => {
    const { getByPlaceholderText, getByText } = renderWithRouter(
      <SearchWidget />
    );
    const input = getByPlaceholderText(/Site search/);
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "div" } });
    // Get the search results
    await waitFor(() => getByText("nothing found"));
  });

  test("should get search results", async () => {
    const { getByPlaceholderText, getByText } = renderWithRouter(
      <SearchWidget />
    );
    const input = getByPlaceholderText(/Site search/);
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "ABb" } });
    // Get the search results
    // But can't use getByText on title because it's peppered with
    // <mark> tags. But the small test with the path should be findable.
    await waitFor(() => getByText(/Web \/ HTML \/ Element \/ abbr/));
  });

  test("should get search results by URI", async () => {
    const { getByText, getByPlaceholderText } = renderWithRouter(
      <SearchWidget />
    );
    const input = getByPlaceholderText(/Site search/);
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    fireEvent.change(input, {
      target: { value: "/dwm/mtabr" },
    });
    // Get the search results
    await waitFor(() => getByText(/Fuzzy searching by URI/));
    await waitFor(() => getByText(/The Abbreviation element/));
  });

  test("should redirect when clicking a search result", async () => {
    const { container, getByText, getByPlaceholderText } = renderWithRouter(
      <SearchWidget />
    );
    const input = getByPlaceholderText(/Site search/);
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    fireEvent.change(input, {
      target: { value: "/dwm/mtabr" },
    });
    // Get the search results
    await waitFor(() => getByText(/The Abbreviation element/));
    const targetResult = container.querySelector("div.highlit");
    // Click the highlit result
    fireEvent.click(targetResult);
    // XXX (peterbe) This test is actually a bit broken. It doesn't
    // actually ever test that the click successfully triggered a
    // redirect to a new location. For some reason
    // `window.location.pathname` doesn't change even though I'm
    // confident it really does call `navigate($NEWURL)` in the
    // main component.
    // Let's leave it until we learn more about how to test
    // with react-router v6.
    // By the way, here's an example of how they do it within tests
    // inside react-router-dom itself:
    // https://github.com/ReactTraining/react-router/blob/e576ca7bf65f62680cc61b7f0ea29f0c8fd13d65/packages/react-router-dom/__tests__/navigate-encode-params-test.js#L53
    // console.log(window.location.pathname);
  });
});
