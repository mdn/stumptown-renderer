import type bcd from "mdn-browser-compat-data/types";

export function getFirst<T>(a: T | T[]): T;
export function getFirst<T>(a: T | T[] | undefined): T | undefined {
  return Array.isArray(a) ? a[0] : a;
}

export function asList<T>(a: T | T[]): T[] {
  return Array.isArray(a) ? a : [a];
}

export function isTruthy<T>(t: T | false | undefined | null): t is T {
  return Boolean(t);
}

export function listFeatures(identifier: bcd.Identifier, name: string = "") {
  return [
    identifier.__compat && {
      name,
      compat: identifier.__compat,
      isRoot: true,
    },
    ...Object.entries(identifier).map(
      ([name, subIdentifier]) =>
        name !== "__compat" &&
        subIdentifier.__compat && {
          name,
          compat: subIdentifier.__compat,
          isRoot: false,
        }
    ),
  ].filter(isTruthy);
}
