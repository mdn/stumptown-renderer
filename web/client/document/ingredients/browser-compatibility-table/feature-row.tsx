import React, { useContext } from "react";
import Link from "next/link";
import type bcd from "mdn-browser-compat-data/types";
import { BrowserInfoContext, BrowserName } from "./browser-info";
import { asList, getFirst, isTruthy } from "./utils";

function getSupportClassName(
  support: bcd.SupportStatement | undefined
): string {
  if (!support) {
    return "unknown";
  }

  let { version_added, version_removed, partial_implementation } = getFirst(
    support
  );

  let className;
  if (version_added === null) {
    className = "unknown";
  } else if (version_added) {
    className = "yes";
    if (version_removed) {
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

function NonBreakingSpace() {
  return <>{"\u00A0"}</>;
}

const CellText = React.memo(
  ({ support }: { support: bcd.SupportStatement | undefined }) => {
    const currentSupport = getFirst(support);

    const added = currentSupport && currentSupport.version_added;
    const removed = currentSupport && currentSupport.version_removed;

    let status:
      | { isSupported: "unknown" }
      | { isSupported: "no" | "yes" | "partial"; label?: React.ReactNode };

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
      default:
        status = { isSupported: "yes", label: added };
        break;
    }

    if (removed) {
      status = {
        isSupported: "no",
        label: (
          <>
            {typeof added === "string" ? added : "?"}
            <NonBreakingSpace />— {typeof removed === "string" ? removed : "?"}
          </>
        ),
      };
    } else if (currentSupport && currentSupport.partial_implementation) {
      status = {
        isSupported: "partial",
        label: typeof added === "string" ? added : "Partial",
      };
    }

    let label, title;
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
      {supportItem.notes && <Icon name="footnote" />}
      {supportItem.alternative_name && <Icon name="altname" />}
      {supportItem.flags && <Icon name="disabled" />}
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

function getNotes(browser: bcd.BrowserNames, support: bcd.SupportStatement) {
  return asList(support)
    .flatMap((item, i) => {
      const supportNotes = [
        item.prefix ? { iconName: "prefix", label: "prefix" } : null,
        item.notes
          ? (Array.isArray(item.notes)
              ? item.notes
              : [item.notes]
            ).map((note) => ({ iconName: "footnote", label: note }))
          : null,
        item.alternative_name
          ? {
              iconName: "altname",
              label: item.alternative_name,
            }
          : null,
        item.flags
          ? {
              iconName: "disabled",
              label: <FlagsNote browser={browser} supportItem={item} />,
            }
          : null,
      ]
        .flat()
        .filter(isTruthy);

      const hasNotes = supportNotes.length > 0;
      return (
        (i === 0 || hasNotes) && (
          <React.Fragment key={i}>
            <dt
              className={`bc-supports-${getSupportClassName(
                support
              )} bc-supports`}
            >
              <CellText support={item} />
              <CellIcons support={item} />
            </dt>
            {supportNotes.map(({ iconName, label }, i) => (
              <dd key={i}>
                <Icon name={iconName} />{" "}
                {typeof label === "string" ? (
                  <span dangerouslySetInnerHTML={{ __html: label }} />
                ) : (
                  label
                )}
              </dd>
            ))}
            {!hasNotes && <dd />}
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
}: {
  browser: bcd.BrowserNames;
  support: bcd.SupportStatement | undefined;
  showNotes: boolean;
  onToggle: () => void;
}) {
  const supportClassName = getSupportClassName(support);
  const hasNotes =
    support &&
    asList(support).some(
      (item) => item.prefix || item.notes || item.alternative_name || item.flags
    );
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
      >
        <span className="bc-browser-name">
          <BrowserName id={browser} />
        </span>
        <CellText {...{ support }} />
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
      </td>
      {showNotes && (
        <td className="bc-history">{getNotes(browser, support!)}</td>
      )}
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
  }: {
    index: number;
    feature: {
      name: string;
      compat: bcd.CompatStatement;
      isRoot: boolean;
    };
    browsers: bcd.BrowserNames[];
    activeCell: number | null;
    onToggleCell: ([row, column]: [number, number]) => void;
  }) => {
    const { name, compat, isRoot } = feature;
    const title = compat.description ? (
      <span dangerouslySetInnerHTML={{ __html: compat.description }} />
    ) : (
      <code>{name}</code>
    );
    const activeBrowser = activeCell !== null ? browsers[activeCell] : null;

    return (
      <>
        <tr>
          <th scope="row">
            {compat.mdn_url && !isRoot ? (
              <Link href={compat.mdn_url}>{title}</Link>
            ) : (
              title
            )}
            {compat.status && <StatusIcons status={compat.status} />}
          </th>
          {browsers.map((browser, i) => (
            <CompatCell
              key={browser}
              browser={browser}
              support={compat.support[browser]}
              showNotes={activeCell === i}
              onToggle={() => onToggleCell([index, i])}
            />
          ))}
        </tr>
        {activeBrowser && (
          <tr className="bc-history">
            <th scope="row" />
            <td colSpan={browsers.length}>
              <dl>{getNotes(activeBrowser, compat.support[activeBrowser]!)}</dl>
            </td>
          </tr>
        )}
      </>
    );
  }
);
