import React, { useContext } from "react";
import type bcd from "mdn-browser-compat-data/types";

export const BrowserInfoContext = React.createContext<bcd.Browsers | null>(
  null
);

export function BrowserName({ id }: { id: bcd.BrowserNames }) {
  const browserInfo = useContext(BrowserInfoContext);
  if (!browserInfo) {
    throw new Error("Missing browser info");
  }
  return <>{browserInfo[id].name}</>;
}
