import React from "react";
import { Redirect, Route, Switch, Link } from "react-router-dom";

import { InteractiveExample } from "./ingredients/interactive-example";
import { Attributes } from "./ingredients/attributes";
import { Examples } from "./ingredients/examples";

const LOCALES = ["en-US"];

function App(appProps) {
  return (
    <div>
      <Route path="/" component={Header} />
      <section className="section">
        <Switch>
          <Route path="/" exact component={Homepage} />
          <Route path="/:locale" exact component={Homepage} />
          <Route
            path="/:locale/docs/:slug*"
            render={props => <Document {...props} {...appProps} />}
          />
          <Route
            path="/docs/:slug*"
            render={props => <Document {...props} {...appProps} />}
          />
          <Route path="/search" component={Search} />
          <Route component={NoMatch} />
        </Switch>
      </section>
    </div>
  );
}

export default App;

function Header(props) {
  return (
    <header>
      <h1>
        <Link to="/">MDN Web Docs</Link>
      </h1>
      <p>Breadcrumbs here...</p>
    </header>
  );
}

class Homepage extends React.Component {
  render() {
    const { location, match } = this.props;
    const { locale } = match.params;
    if (!locale) {
      return <Redirect to={LOCALES[0]} />;
    } else if (!LOCALES.includes(locale)) {
      const found = LOCALES.find(
        each => each.toLowerCase() === locale.toLowerCase()
      );
      if (found) {
        return <Redirect to={found} />;
      } else {
        return <NoMatch location={location} message="Locale not found" />;
      }
    }
    return (
      <div>
        <h2>Welcome to MDN</h2>
        <ul>
          <li>
            <Link to="/docs/Web/HTML/Element/audio">HTML/audio</Link>
          </li>
          <li>
            <Link to="/docs/Web/HTML/Element/video">HTML/video</Link>
          </li>
          <li>
            <Link to="/docs/Web/HTML/Element/canvas">HTML/canvas</Link>
          </li>
        </ul>
      </div>
    );
  }
}

class Document extends React.Component {
  state = {
    document: this.props.document || null,
    loading: false,
    notFound: false,
    loadingError: null
  };

  componentDidMount() {
    const { match } = this.props;
    const { locale, slug } = match.params;
    if (!this.state.document) {
      this.fetchDocument(locale, slug);
    }
  }

  componentDidUpdate(prevProps) {
    const { match } = this.props;
    const prevMatch = prevProps.match;
    if (
      prevMatch.params.locale !== match.params.locale ||
      prevMatch.params.slug !== match.params.slug
    ) {
      console.log("New locale+slug:", [match.params.locale, match.params.slug]);
      this.fetchDocument(match.params.locale, match.params.slug);
    }
  }

  fetchDocument = (locale, slug) => {
    this.setState({ loading: true }, async () => {
      let url = document.location.pathname;
      if (!url.endsWith("/")) url += "/";
      url += "index.json";
      console.log("OPENING", url);
      let response;
      try {
        // response = await fetch(`/api/v0/documents/${locale}/${slug}`);
        // response = await fetch(`index.json`);
        response = await fetch(url);
      } catch (ex) {
        return this.setState({ loading: false, loadingError: ex });
      }
      if (!response.ok) {
        console.log(response);
        return this.setState({ loading: false, loadingError: response });
      } else {
        const data = await response.json();
        document.title = data.document.title;
        this.setState({ document: data.document, loading: false });
      }
    });
  };

  render() {
    const { document, loadingError, loading, notFound } = this.state;
    // console.log("RENDERING DOCUMENT:", document);
    const { location } = this.props;
    if (notFound) {
      return <NoMatch location={location} message="Document not found" />;
    }
    if (loading) {
      return <p>Loading...</p>;
    }
    if (loadingError) {
      return <LoadingError error={loadingError} />;
    }
    if (!document) {
      return null;
    }
    return (
      <div>
        <div className="page-title">
          <h1>{document.title}</h1>
        </div>
        <div className="main">
          <div className="sidebar">SIDE BAR</div>
          <div className="content">
            <RenderHTMLElementDocument document={document} />
          </div>
        </div>
      </div>
    );
  }
}

function RenderHTMLElementDocument({ document }) {
  let sections = [];

  sections.push(<Prose section={document.prose.short_description} />);
  sections.push(<InteractiveExample document={document} />);
  sections.push(<Prose section={document.prose.overview} />);
  sections.push(<Attributes document={document} />);
  sections.push(<ProseWithHeading section={document.prose.usage_notes} />);
  sections.push(<ProseWithHeading section={document.prose.accessibility_concerns} />);
  sections.push(<Examples document={document} />);
  sections.push(<BrowserCompatibility document={document} />);
  sections.push(<ProseWithHeading section={document.prose.see_also} />);

  sections = sections.filter(s => !!s);

  if (document.contributors) {
    sections.push(
      <Contributors key="contributors" contributors={document.contributors} />
    );
  }

  return sections;
}

function Prose({ section }) {
  if (!section) {
    return null;
  }
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: section.content }} />
    </>
  );
}

function ProseWithHeading({ id, section }) {
  if (!section) {
    return null;
  }
  return (
    <>
      <h2 id={id}>{section.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: section.content }} />
    </>
  );
}

function Contributors({ contributors }) {
  return (
    <div>
      <b>Contributors to this page:</b>
      <span dangerouslySetInnerHTML={{ __html: contributors }} />
    </div>
  );
}

function BrowserCompatibility({ content }) {
  return (
    <table>
      <thead>
        <tr>
          <th rowSpan={2} />
          <th colSpan={2}>Desktop</th>
          <th colSpan={2}>Mobile</th>
        </tr>
        <tr>
          <th>Chrome</th>
          <th>Edge</th>
          <th>Chrome</th>
          <th>Edge</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <code>video</code>
          </td>
          <td style={{ backgroundColor: "#e4f8e1" }}>3</td>
          <td style={{ backgroundColor: "#e4f8e1" }}>Yes</td>
          <td>?</td>
          <td style={{ backgroundColor: "#f8e1e1" }}>No</td>
        </tr>
      </tbody>
    </table>
  );
}

function LoadingError({ error }) {
  return (
    <div className="loading-error">
      <h3>Loading Error</h3>
      {error instanceof window.Response ? (
        <p>
          <b>{error.status}</b> on <b>{error.url}</b>
          <br />
          <small>{error.statusText}</small>
        </p>
      ) : (
        <p>
          <code>{error.toString()}</code>
        </p>
      )}
    </div>
  );
}

function NoMatch({ location, message = null }) {
  return (
    <div>
      <h3>Page Not Found</h3>
      <p>
        {message ? message : `Sorry, no document for ${location.pathname}.`}
      </p>
    </div>
  );
}

function Search(props) {
  const [search, setSearch] = React.useState("");
  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        console.log(`SEARCH FOR ${search}`);
      }}
    >
      <input
        type="search"
        value={search}
        onChange={event => {
          setSearch(event.target.value);
        }}
        placeholder="Search..."
      />
      <button type="submit">Search</button>
    </form>
  );
}
