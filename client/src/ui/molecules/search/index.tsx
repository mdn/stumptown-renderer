import "./index.scss";

import { SearchNavigateWidget } from "../../../search";

export function Search(props) {
  return (
    <div className="header-search">
      <SearchNavigateWidget {...props} />
    </div>
  );
}
