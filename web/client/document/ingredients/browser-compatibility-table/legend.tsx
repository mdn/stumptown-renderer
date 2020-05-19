import React from "react";
import type bcd from "mdn-browser-compat-data/types";
import { asList, listFeatures } from "./utils";

// Also specifies the order in which the legend appears
const LEGEND_LABELS = {
  yes: "Full support",
  partial: "Partial support",
  no: "No support",
  unknown: "Compatibility unknown",
  experimental: "Experimental. Expect behavior to change in the future.",
  "non-standard": "Non-standard. Expect poor cross-browser support.",
  deprecated: "Deprecated. Not for use in new websites.",
  footnote: "See implementation notes.",
  disabled: "User must explicitly enable this feature.",
  altname: "Uses a non-standard name.",
  prefix: "Requires a vendor prefix or different name for use.",
};
type LEGEND_KEY = keyof typeof LEGEND_LABELS;

function getActiveLegendItems(compat: bcd.Identifier) {
  const legendItems = new Set<LEGEND_KEY>();

  for (const feature of listFeatures(compat)) {
    const { status } = feature.compat;

    if (status) {
      if (status.experimental) {
        legendItems.add("experimental");
      }
      if (status.deprecated) {
        legendItems.add("deprecated");
      }
      if (!status.standard_track) {
        legendItems.add("non-standard");
      }
    }

    for (const browserSupport of Object.values(feature.compat.support)) {
      if (!browserSupport) {
        legendItems.add("no");
        continue;
      }

      for (const versionSupport of asList(browserSupport)) {
        if (versionSupport.version_added) {
          legendItems.add("yes");
        } else if (versionSupport.version_added == null) {
          legendItems.add("unknown");
        } else {
          legendItems.add("no");
        }

        if (versionSupport.partial_implementation) {
          legendItems.add("partial");
        }
        if (versionSupport.prefix) {
          legendItems.add("prefix");
        }
        if (versionSupport.notes) {
          legendItems.add("footnote");
        }
        if (versionSupport.alternative_name) {
          legendItems.add("altname");
        }
        if (versionSupport.flags) {
          legendItems.add("disabled");
        }
      }
    }
  }
  return Object.keys(LEGEND_LABELS)
    .filter((key) => legendItems.has(key as LEGEND_KEY))
    .map((key) => [key, LEGEND_LABELS[key]]);
}

export function Legend({ compat }: { compat: bcd.Identifier }) {
  return (
    <section className="bc-legend">
      <h3 className="offscreen highlight-spanned" id="Legend">
        <span className="highlight-span">Legend</span>
      </h3>
      <dl>
        {getActiveLegendItems(compat).map(([key, label]) =>
          ["yes", "partial", "no", "unknown"].includes(key) ? (
            <React.Fragment key={key}>
              <dt key={key}>
                <span className={`bc-supports-${key} bc-supports`}>
                  <abbr
                    className={`bc-level bc-level-${key} only-icon`}
                    title={label}
                  >
                    <span>{label}</span>
                  </abbr>
                </span>
              </dt>
              <dd>{label}</dd>
            </React.Fragment>
          ) : (
            <React.Fragment key={key}>
              <dt>
                <abbr className="only-icon" title={label}>
                  <span>{label}</span>
                  <i className={`ic-${key}`} />
                </abbr>
              </dt>
              <dd>{label}</dd>
            </React.Fragment>
          )
        )}
      </dl>
    </section>
  );
}
