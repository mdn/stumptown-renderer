import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { BrowserCompatibilityErrorBoundary } from "./error-boundary";

function renderWithRouter(component) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}

it("renders without crashing", () => {
  const { container } = renderWithRouter(
    <BrowserCompatibilityErrorBoundary>
      <div />
    </BrowserCompatibilityErrorBoundary>
  );
  expect(container).toBeDefined();
});

it("renders crashing mock component", () => {
  function CrashingComponent() {
    const [crashing, setCrashing] = React.useState(false);

    if (crashing) {
      throw new Error("42");
    }
    return (
      <div
        onClick={() => {
          setCrashing(true);
        }}
      />
    );
  }

  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  const { container } = renderWithRouter(
    <BrowserCompatibilityErrorBoundary>
      <CrashingComponent />
    </BrowserCompatibilityErrorBoundary>
  );
  expect(container.querySelector(".bc-table-error-boundary")).toBeNull();
  const div = container.querySelector("div");
  div && fireEvent.click(div);

  expect(consoleError).toHaveBeenCalledWith(
    expect.stringMatching("The above error occurred")
  );

  // TODO: When `BrowserCompatibilityErrorBoundary` reports to Sentry, spy on the report function so that we can assert the error stack
  expect(container.querySelector(".bc-table-error-boundary")).toBeDefined();
});
