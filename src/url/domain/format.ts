import { global, location } from '../../global';
import { ObjectFreeze } from '../../alias';
import { Encoded } from '../attribute/encode';
import { Normalized } from '../attribute/normalize';
import { memoize } from '../../memoize';
import { Cache } from '../../cache';
import { flip } from '../../flip';
import { uncurry } from '../../curry';

namespace Identifier {
  declare class Identity<T> {
    private static readonly IDENTITY: unique symbol;
    private readonly [Identity.IDENTITY]: T;
  }

  export type URL<T> = Identity<T> & string;
}

type URL<T> = Identifier.URL<T>;


// https://www.ietf.org/rfc/rfc3986.txt

export type StandardURL = URL<Encoded & Normalized>;

export function standardize(url: URL<unknown>, base?: string): void
export function standardize(url: string, base?: string): StandardURL
export function standardize(url: string, base: string = location.href): StandardURL {
  return encode(normalize(url, base));
}


type EncodedURL<T = Encoded> = URL<Encoded & T>;

function encode(url: EncodedURL): void
function encode<T>(url: URL<T>): EncodedURL<T>
function encode(url: string): EncodedURL
function encode(url: string): EncodedURL {
  return url
    // Trim
    .trim()
    // Percent-encoding
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]?|[\uDC00-\uDFFF]/g, str =>
      str.length === 2
        ? str
        : '')
    .replace(/%(?![0-9A-F]{2})|[^%\[\]]+/ig, encodeURI)
    .replace(/\?[^#]+/, query =>
      '?' +
      query.slice(1)
        .replace(/%[0-9A-F]{2}|[^=&]/ig, str =>
          str.length < 3
            ? encodeURIComponent(str)
            : str))
    // Use uppercase letters within percent-encoding triplets
    .replace(/%[0-9A-F]{2}/ig, str => str.toUpperCase())
    .replace(/#.+/, url.slice(url.indexOf('#')).trim()) as EncodedURL;
}
export { encode as _encode }


export type NormalizedURL = URL<Normalized>;

function normalize(url: URL<unknown>, base: string): void
function normalize(url: string, base: string): NormalizedURL
function normalize(url: string, base: string): NormalizedURL {
  return new ReadonlyURL(url, base).href as NormalizedURL;
}

export interface ReadonlyURL extends Readonly<global.URL> {
}
export class ReadonlyURL {
  // Can't freeze URL object in the Firefox extension environment.
  // ref: https://github.com/falsandtru/pjax-api/issues/44#issuecomment-633915035
  private static readonly freezable = (() => {
    try {
      ObjectFreeze(new global.URL(location.href));
      return true;
    }
    catch {
      return false;
    }
  })();
  private static readonly new: (url: string, base: string) => ReadonlyURL = flip(uncurry(memoize((base: string) => memoize((url: string) => new global.URL(formatURLForEdge(url, base), base), new Cache(100)), new Cache(100))));
  constructor(url: string, base: string) {
    return ReadonlyURL.freezable
      ? ObjectFreeze(ReadonlyURL.new(url, base))
      : ReadonlyURL.new(url, base);
  }
}

function formatURLForEdge(url: string, base: string): string {
  return url.trim() || base;
}
