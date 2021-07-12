import React from "react";
import { useUserData } from "../../../user-context";
import { Doc } from "../../types";

const App = React.lazy(() => import("./app"));

export function BookmarkToggle({ doc }: { doc: Doc }) {
  const userData = useUserData();
  const isServer = typeof window === "undefined";
  if (isServer || !userData || (userData && !userData.isSubscriber)) {
    return null;
  }
  return (
    <React.Suspense fallback={null}>
      <App doc={doc} />
    </React.Suspense>
  );
}
