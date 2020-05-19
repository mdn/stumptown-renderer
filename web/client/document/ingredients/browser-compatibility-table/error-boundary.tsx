import React from "react";

/**
 * The error boundary for BrowserCompatibilityTable.
 *
 * When the whole BrowserCompatibilityTable crashes, for whatever reason,
 * this component will show a friendly message
 * to replace that crashed component
 */
export class BrowserCompatibilityErrorBoundary extends React.Component<
  any,
  any
> {
  state = {
    error: null,
  };
  componentDidCatch(error, _errorInfo) {
    this.setState({
      error,
    });
    // TODO: Report this error to Sentry, https://github.com/mdn/yari/issues/99
  }
  render() {
    if (this.state.error) {
      return (
        <>
          <div className="bc-table-error-boundary">
            Unfortunately, this table has encountered unhandled error and the
            content cannot be shown.
            {/* TODO: When error reporting is set up, the message should include "We have been notified of this error" or something similar */}
          </div>
        </>
      );
    }
    return this.props.children;
  }
}
