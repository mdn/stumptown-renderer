import React, { useContext } from "react";
import type bcd from "@mdn/browser-compat-data/types";
import {
  BrowserInfoContext,
  BrowserName,
  BrowserPreviewName,
} from "./browser-info";
import { asList, getFirst, isTruthy } from "./utils";

// Yari builder will attach extra keys from the compat data
// it gets from @mdn/browser-compat-data. These are "Yari'esque"
// extras that helps us avoiding to have a separate data structure.
interface CompatStatementExtended extends bcd.CompatStatement {
  // When a compat statement has a .mdn_url but it's actually not a good
  // one, the Yari builder will attach an extra boolean that indicates
  // that it's not a valid link.
  // Note, it's only 'true' if it's present, hence this interface definition.
  bad_url?: true;
}

// Extended for the fields, beyond the bcd types, that are extra-added
// exclusively in Yari.
interface SimpleSupportStatementExtended extends bcd.SimpleSupportStatement {
  // Known for some support statements where the browser *version* is known,
  // as opposed to just "true" and if the version release date is known.
  release_date?: string;
}

type SupportStatementExtended =
  | SimpleSupportStatementExtended
  | SimpleSupportStatementExtended[];

function getSupportClassName(
  support: SupportStatementExtended | undefined
): string {
  if (!support) {
    return "unknown";
  }

  let { flags, version_added, version_removed, partial_implementation } =
    getFirst(support);

  let className;
  if (version_added === null) {
    className = "unknown";
  } else if (version_added === "preview") {
    className = "preview";
  } else if (version_added) {
    className = "yes";
    if (version_removed || (flags && flags.length)) {
      className = "no";
    }
  } else {
    className = "no";
  }
  if (partial_implementation && !version_removed) {
    className = "partial";
  }

  return className;
}

function getSupportBrowserReleaseDate(
  support: SupportStatementExtended | undefined
): string | undefined {
  if (!support) {
    return undefined;
  }
  return getFirst(support).release_date;
}

function StatusIcons({ status }: { status: bcd.StatusBlock }) {
  const icons = [
    status.experimental && {
      title: "Experimental. Expect behavior to change in the future.",
      text: "Experimental",
      iconClassName: "ic-experimental",
    },
    status.deprecated && {
      title: "Deprecated. Not for use in new websites.",
      text: "Deprecated",
      iconClassName: "ic-deprecated",
    },
    !status.standard_track && {
      title: "Non-standard. Expect poor cross-browser support.",
      text: "Non-standard",
      iconClassName: "ic-non-standard",
    },
  ].filter(isTruthy);
  return icons.length === 0 ? null : (
    <div className="bc-icons">
      {icons.map((icon) => (
        <abbr key={icon.iconClassName} className="only-icon" title={icon.title}>
          <span>{icon.text}</span>
          <i className={icon.iconClassName} />
        </abbr>
      ))}
    </div>
  );
}

function labelFromString(
  version: string | boolean | null | undefined,
  browser: bcd.BrowserNames
) {
  if (typeof version !== "string") {
    return <>{"?"}</>;
  }
  // Treat BCD ranges as exact versions to avoid confusion for the reader
  // See https://github.com/mdn/yari/issues/3238
  if (version.startsWith("≤")) {
    return <>{version.slice(1)}</>;
  }
  if (version === "preview") {
    return <BrowserPreviewName id={browser} />;
  }
  return <>{version}</>;
}

const CellText = React.memo(
  ({
    support,
    browser,
  }: {
    support: bcd.SupportStatement | undefined;
    browser: bcd.BrowserNames;
  }) => {
    const currentSupport = getFirst(support);

    const added = currentSupport && currentSupport.version_added;
    const removed = currentSupport && currentSupport.version_removed;

    let status:
      | { isSupported: "unknown" }
      | {
          isSupported: "no" | "yes" | "partial" | "preview";
          label?: React.ReactNode;
        };

    switch (added) {
      case null:
        status = { isSupported: "unknown" };
        break;
      case true:
        status = { isSupported: "yes" };
        break;
      case false:
        status = { isSupported: "no" };
        break;
      case "preview":
        status = { isSupported: "preview" };
        break;
      default:
        status = { isSupported: "yes", label: labelFromString(added, browser) };
        break;
    }

    if (removed) {
      status = {
        isSupported: "no",
        label: (
          <>
            {labelFromString(added, browser)}&#8202;&ndash;&#8202;
            {labelFromString(removed, browser)}
          </>
        ),
      };
    } else if (currentSupport && currentSupport.partial_implementation) {
      status = {
        isSupported: "partial",
        label:
          typeof added === "string"
            ? labelFromString(added, browser)
            : "Partial",
      };
    }

    let label: string | React.ReactNode;
    let title = "";
    switch (status.isSupported) {
      case "yes":
        title = "Full support";
        label = status.label || "Yes";
        break;

      case "partial":
        title = "Partial support";
        label = status.label || "Partial";
        break;

      case "no":
        title = "No support";
        label = status.label || "No";
        break;

      case "preview":
        title = "Preview browser support";
        label = <BrowserPreviewName id={browser} />;
        break;

      case "unknown":
        title = "Compatibility unknown; please update this.";
        label = "?";
        break;
    }

    return (
      <>
        <abbr
          className={`bc-level-${getSupportClassName(
            currentSupport
          )} only-icon`}
          title={title}
        >
          <span>{title}</span>
        </abbr>
        {label}
      </>
    );
  }
);

function Icon({ name }: { name: string }) {
  return (
    <abbr className="only-icon" title={name}>
      <span>{name}</span>
      <i className={`ic-${name}`} />
    </abbr>
  );
}

function CellIcons({ support }: { support: bcd.SupportStatement | undefined }) {
  const supportItem = getFirst(support);
  if (!supportItem) {
    return null;
  }
  return (
    <div className="bc-icons">
      {supportItem.prefix && <Icon name="prefix" />}
      {supportItem.alternative_name && <Icon name="altname" />}
      {supportItem.flags && <Icon name="disabled" />}
      {supportItem.notes && <Icon name="footnote" />}
    </div>
  );
}

function FlagsNote({
  supportItem,
  browser,
}: {
  supportItem: bcd.SimpleSupportStatement;
  browser: bcd.BrowserNames;
}) {
  const browserInfo = useContext(BrowserInfoContext);
  if (!browserInfo) {
    throw new Error("Missing browser info");
  }
  const info = browserInfo[browser];

  const hasAddedVersion = typeof supportItem.version_added === "string";
  const hasRemovedVersion = typeof supportItem.version_removed === "string";
  const flags = supportItem.flags || [];
  return (
    <>
      {hasAddedVersion && `From version ${supportItem.version_added}`}
      {hasRemovedVersion && (
        <>
          {hasAddedVersion ? " until" : "Until"} version{" "}
          {supportItem.version_removed} (exclusive)
        </>
      )}
      {hasAddedVersion || hasRemovedVersion ? ": this" : "This"} feature is
      behind the
      {flags.map((flag, i) => {
        const valueToSet = flag.value_to_set && (
          <>
            {" "}
            (needs to be set to <code>{flag.value_to_set}</code>)
          </>
        );
        return (
          <React.Fragment key={flag.name}>
            <code>{flag.name}</code>
            {flag.type === "preference" && <> preferences{valueToSet}</>}
            {flag.type === "runtime_flag" && <> runtime flag{valueToSet}</>}
            {i < flags.length - 1 && " and the "}
          </React.Fragment>
        );
      })}
      .
      {info.pref_url &&
        flags.some((flag) => flag.type === "preference") &&
        ` To change preferences in ${info.name}, visit ${info.pref_url}.`}
    </>
  );
}

function getNotes(
  browser: bcd.BrowserNames,
  support: bcd.SupportStatement,
  locale: string
) {
  return asList(support)
    .flatMap((item, i) => {
      const supportNotes = [
        item.version_removed
          ? {
              iconName: "footnote",
              label: (
                <>
                  Removed in {labelFromString(item.version_removed, browser)}{" "}
                  and later
                </>
              ),
            }
          : null,
        item.partial_implementation
          ? {
              iconName: "footnote",
              label: "Partial support",
            }
          : null,
        item.prefix
          ? {
              iconName: "footnote",
              label: `Implemented with the vendor prefix: ${item.prefix}`,
            }
          : null,
        item.alternative_name
          ? {
              iconName: "footnote",
              label: `Alternate name: ${item.alternative_name}`,
            }
          : null,
        item.flags
          ? {
              iconName: "footnote",
              label: <FlagsNote browser={browser} supportItem={item} />,
            }
          : null,
        item.notes
          ? (Array.isArray(item.notes) ? item.notes : [item.notes]).map(
              (note) => ({ iconName: "footnote", label: note })
            )
          : null,
        item.version_added === "preview"
          ? {
              iconName: "footnote",
              label: "Preview browser support",
            }
          : null,
        // If we encounter nothing else than the required `version_added` and
        // `release_date` properties, assume full support
        Object.keys(item).filter(
          (x) => !["version_added", "release_date"].includes(x)
        ).length === 0 && item.version_added !== "preview"
          ? {
              iconName: "footnote",
              label: "Full support",
            }
          : null,
      ]
        .flat()
        .filter(isTruthy);

      const hasNotes = supportNotes.length > 0;
      return (
        (i === 0 || hasNotes) && (
          <React.Fragment key={i}>
            <div className="bc-notes-wrapper">
              <dt
                className={`bc-supports-${getSupportClassName(
                  item
                )} bc-supports`}
              >
                <CellText support={item} browser={browser} />
                <CellIcons support={item} />
              </dt>
              {supportNotes.map(({ iconName, label }, i) => {
                return (
                  <dd key={i}>
                    <Icon name={iconName} />{" "}
                    {typeof label === "string" ? (
                      <span dangerouslySetInnerHTML={{ __html: label }} />
                    ) : (
                      label
                    )}
                  </dd>
                );
              })}
              {!hasNotes && <dd />}
            </div>
          </React.Fragment>
        )
      );
    })
    .filter(isTruthy);
}

function CompatCell({
  browser,
  support,
  showNotes,
  onToggle,
  locale,
}: {
  browser: bcd.BrowserNames;
  support: bcd.SupportStatement | undefined;
  showNotes: boolean;
  onToggle: () => void;
  locale: string;
}) {
  const supportClassName = getSupportClassName(support);
  const browserReleaseDate = getSupportBrowserReleaseDate(support);
  // Whenever the support statement is complex (array with more than one entry)
  // or if a single entry is complex (prefix, notes, etc.),
  // we need to render support details in `bc-history`
  const hasNotes =
    support &&
    (asList(support).length > 1 ||
      asList(support).some(
        (item) =>
          item.prefix || item.notes || item.alternative_name || item.flags
      ));
  return (
    <>
      <td
        className={`bc-browser-${browser} bc-supports-${supportClassName} ${
          hasNotes ? "bc-has-history" : ""
        }`}
        aria-expanded={showNotes ? "true" : "false"}
        tabIndex={hasNotes ? 0 : undefined}
        onClick={
          hasNotes
            ? () => {
                onToggle();
              }
            : undefined
        }
        title={
          browserReleaseDate ? `Released ${browserReleaseDate}` : undefined
        }
      >
        <span className="bc-browser-name">
          <BrowserName id={browser} />
        </span>
        <CellText {...{ support }} browser={browser} />
        <CellIcons support={support} />
        {hasNotes && (
          <button
            type="button"
            title="Open implementation notes"
            className={`bc-history-link only-icon ${
              showNotes ? "bc-history-link-inverse" : ""
            }`}
          >
            <span>Open</span>
            <i className="ic-history" aria-hidden="true" />
          </button>
        )}
        {showNotes && (
          <dl className="bc-notes-list bc-history bc-history-mobile">
            {getNotes(browser, support!, locale)}
          </dl>
        )}
      </td>
    </>
  );
}

export const FeatureRow = React.memo(
  ({
    index,
    feature,
    browsers,
    activeCell,
    onToggleCell,
    locale,
  }: {
    index: number;
    feature: {
      name: string;
      compat: CompatStatementExtended;
      isRoot: boolean;
    };
    browsers: bcd.BrowserNames[];
    activeCell: number | null;
    onToggleCell: ([row, column]: [number, number]) => void;
    locale: string;
  }) => {
    const { name, compat, isRoot } = feature;
    const title = compat.description ? (
      <span dangerouslySetInnerHTML={{ __html: compat.description }} />
    ) : (
      <code>{name}</code>
    );
    const activeBrowser = activeCell !== null ? browsers[activeCell] : null;

    let titleNode: string | React.ReactNode;

    if (compat.bad_url && compat.mdn_url) {
      titleNode = (
        <div className="bc-table-row-header">
          <abbr className="new" title={`${compat.mdn_url} does not exist`}>
            {title}
          </abbr>
          {compat.status && <StatusIcons status={compat.status} />}
        </div>
      );
    } else if (compat.mdn_url && !isRoot) {
      titleNode = (
        <a href={compat.mdn_url} className="bc-table-row-header">
          {title}
          {compat.status && <StatusIcons status={compat.status} />}
        </a>
      );
    } else {
      titleNode = (
        <div className="bc-table-row-header">
          {title}
          {compat.status && <StatusIcons status={compat.status} />}
        </div>
      );
    }

    return (
      <>
        <tr>
          <th scope="row">{titleNode}</th>
          {browsers.map((browser, i) => (
            <CompatCell
              key={browser}
              browser={browser}
              support={compat.support[browser]}
              showNotes={activeCell === i}
              onToggle={() => onToggleCell([index, i])}
              locale={locale}
            />
          ))}
        </tr>
        {activeBrowser && (
          <tr className="bc-history">
            <td colSpan={browsers.length + 1}>
              <dl className="bc-notes-list">
                {getNotes(
                  activeBrowser,
                  compat.support[activeBrowser]!,
                  locale
                )}
              </dl>
            </td>
          </tr>
        )}
      </>
    );
  }
);
