import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SearchWidget } from "./search";

function renderWithRouter(component) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}

it("renders without crashing", () => {
  const { container } = renderWithRouter(<SearchWidget />);
  expect(container).toBeDefined();
});

test("input placeholder changes when focused", async () => {
  const { container } = renderWithRouter(<SearchWidget />);
  const input = container.querySelector('[type="search"]');
  fireEvent.focus(input);
  expect(input.placeholder).toBe("Initializing search...");
  await waitFor(() =>
    container.querySelector('input[type="search"][placeholder^="Go ahead"]')
  );
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
      })
    );
    global.fetch.mockClear();
  });

  test("XHR request on focusing input the first time", () => {
    const { container } = renderWithRouter(<SearchWidget />);
    const input = container.querySelector('[type="search"]');
    // Fire initial focus event
    fireEvent.focus(input);
    // Expect XHR
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Clear the mock fetch
    global.fetch.mockClear();
    // Fire focus event again to ensure it's not called again
    fireEvent.focus(input);
    expect(global.fetch).toHaveBeenCalledTimes(0);
  });

  test("should set titles in localStorage", async () => {
    const { container } = renderWithRouter(<SearchWidget />);
    const input = container.querySelector('[type="search"]');
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    await waitFor(() =>
      container.querySelector('input[type="search"][placeholder^="Go ahead"]')
    );
    expect(global.localStorage.getItem("titles")).toBeDefined();
  });

  test("should NOT get search results", async () => {
    const { container, getByText } = renderWithRouter(<SearchWidget />);
    const input = container.querySelector('[type="search"]');
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    await waitFor(() =>
      container.querySelector('input[type="search"][placeholder^="Go ahead"]')
    );
    fireEvent.change(input, { target: { value: "div" } });
    // Get the search results
    const searchResults = await waitFor(() =>
      container.querySelector("div.search-results")
    );
    expect(searchResults.children.length).toBe(1);
    expect(input.classList.contains("has-search-results")).toBe(true);
    expect(getByText("nothing found")).toBeDefined();
  });

  test("should get search results", async () => {
    const { container } = renderWithRouter(<SearchWidget />);
    const input = container.querySelector('[type="search"]');
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    await waitFor(() =>
      container.querySelector('input[type="search"][placeholder^="Go ahead"]')
    );
    fireEvent.change(input, { target: { value: "ABb" } });
    // Get the search results
    const searchResults = await waitFor(() =>
      container.querySelector("div.search-results")
    );
    expect(searchResults.children.length).toBe(1);
    expect(input.classList.contains("has-search-results")).toBe(true);
    expect(container.textContent).toContain("The Abbreviation element");
  });

  test("should get search results by URI", async () => {
    const { container, getByText, debug } = renderWithRouter(<SearchWidget />);
    const input = container.querySelector('[type="search"]');
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    await waitFor(() =>
      container.querySelector('input[type="search"][placeholder^="Go ahead"]')
    );
    debug();
    console.log(
      container.querySelector('input[type="search"][placeholder^="Go ahead"]')
    );
    fireEvent.change(input, {
      target: { value: "/dwm/mtabr" },
    });
    // Get the search results
    const searchResults = await waitFor(() =>
      container.querySelector("div.search-results")
    );
    debug();
    // Length of children should be 2 including the "Fuzzy searching by URI" div
    expect(searchResults.children.length).toBe(2);
    expect(input.classList.contains("has-search-results")).toBe(true);
    expect(getByText("<abbr>: The Abbreviation element")).toBeDefined();
    expect(getByText("Fuzzy searching by URI")).toBeDefined();
  });

  test("should redirect when clicking a search result", async (done) => {
    // Define onPushState function to listen for redirect
    const onPushState = (event) => {
      expect(event.detail.url).toBe("/docs/Web/HTML/Element/abbr");
      window.removeEventListener("pushState", onPushState);
      done();
    };
    window.addEventListener("pushState", onPushState);
    const { container } = renderWithRouter(<SearchWidget pathname="/" />);
    const input = container.querySelector('[type="search"]');
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    await waitFor(() =>
      container.querySelector('input[type="search"][placeholder^="Go ahead"]')
    );
    fireEvent.change(input, {
      target: { value: "/docs/Web/HTML/Element/abbr" },
    });
    // Get the search results
    await waitFor(() => container.querySelector("div.search-results"));
    const targetResult = container.querySelector("div.highlit");
    // Click the highlit result
    fireEvent.click(targetResult);
  });

  test("Should remove search-results class after clicking a result", async () => {
    const { container } = renderWithRouter(<SearchWidget pathname="/" />);
    const input = container.querySelector('[type="search"]');
    // Focus input to get titles from XHR
    fireEvent.focus(input);
    await waitFor(() =>
      container.querySelector('input[type="search"][placeholder^="Go ahead"]')
    );
    fireEvent.change(input, {
      target: { value: "/docs/Web/HTML/Element/abbr" },
    });
    // Get the search results
    await waitFor(() => container.querySelector("div.search-results"));
    const targetResult = container.querySelector("div.highlit");
    // Click the highlit result
    fireEvent.click(targetResult);
    expect(container.querySelector("div.search-results")).toBe(null);
  });
});
