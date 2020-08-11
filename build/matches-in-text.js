function* findMatchesInText(needle, haystack, { attribute = null } = {}) {
  // Need to remove any characters that can affect a regex if we're going
  // use the string in a manually constructed regex.
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let rex;
  if (attribute) {
    rex = new RegExp(`${attribute}=['"](${escaped})['"]`, "g");
  } else {
    rex = new RegExp(`(${escaped})`, "g");
  }
  for (const match of haystack.matchAll(rex)) {
    const left = haystack.slice(0, match.index);
    const line = (left.match(/\n/g) || []).length + 1;
    const lastIndexOf = left.lastIndexOf("\n") + 1;
    const column =
      match.index - lastIndexOf + 1 + (attribute ? attribute.length + 2 : 0);
    yield { line, column };
  }
}

function replaceMatchesInText(
  needle,
  haystack,
  replacement,
  { inAttribute = null }
) {
  // Need to remove any characters that can affect a regex if we're going
  // use the string in a manually constructed regex.
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let rex;
  if (inAttribute) {
    rex = new RegExp(`${inAttribute}=['"](${escaped})['"]`, "g");
  } else {
    rex = new RegExp(`(${escaped})`, "g");
  }
  return haystack.replace(rex, (match, p1) => {
    return match.replace(p1, replacement);
  });
}

module.exports = { findMatchesInText, replaceMatchesInText };
