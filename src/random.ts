import { Math, Set, crypto } from './global';

const radixes = Object.freeze([...Array(7)].map((_, i) => 1 << i));
assert.deepStrictEqual(radixes, [1, 2, 4, 8, 16, 32, 64]);
const masks = Object.freeze(radixes.map(radix => radix - 1));
const dict0_ = [
  ...[...Array(36)].map((_, i) => i.toString(36)),
  ...[...Array(36)].map((_, i) => i.toString(36).toUpperCase()).slice(-26),
  '-', '_',
].join('');
assert(dict0_.length === 64);
// eslint-disable-next-line
assert(dict0_.match(/^0.*9a.*zA.*Z-_$/));
const dictAz = [
  ...[...Array(36)].map((_, i) => i.toString(36).toUpperCase()).slice(-26),
  ...[...Array(36)].map((_, i) => i.toString(36)).slice(-26),
].join('');
assert(dictAz.length === 52);
// eslint-disable-next-line
assert(dictAz.match(/^A.*Za.*z$/));

export const rnd16 = cons(16);
export const rnd32 = cons(32);
export const rnd62 = cons(62);
export const rnd64 = cons(64);
export const rnd0f = conv(rnd16, dict0_);
export const rnd0v = conv(rnd32, dict0_);
export const rnd0Z = conv(rnd62, dict0_);
export const rnd0_ = conv(rnd64, dict0_);
export const rndAP = conv(rnd16, dictAz);
export const rndAf = conv(rnd32, dictAz);

export function unique(rnd: (len: number) => string, len: number = 1, mem?: Set<string>): () => string {
  const independence = !mem;
  mem ??= new Set();
  const trials = 3;
  let prefixes: Set<string>;
  let prefix = '';
  return function random(): string {
    assert(mem = mem!);
    for (let i = 0; i < trials; ++i) {
      const r = rnd(len);
      if (mem.has(r)) continue;
      try {
        mem.add(r);
      }
      catch (reason) {
        // ベンチマーク程度でもSetがパンクする場合がある。
        if (!independence) throw reason;
        prefixes ??= new Set();
        prefix ||= '?';
        assert(prefix.length > 0);
        for (let i = 0; i < trials; ++i) {
          prefix = rnd(prefix.length);
          if (prefixes.has(prefix)) continue;
          prefixes.add(prefix);
          mem.clear();
          return random();
        }
        prefixes = new Set();
        prefix += '?';
        return random();
      }
      return prefix + r;
    }
    ++len;
    independence && mem.clear();
    return random();
  };
}

function cons(size: number): () => number {
  const len = radixes.findIndex(radix => radix >= size) as 1;
  assert(len > 0);
  return function rnd(): number {
    const r = random(len);
    assert(r < radixes[len]);
    return r < size
      ? r
      : rnd();
  };
}

function conv(rnd: () => number, dict: string): (len?: number) => string {
  return (len = 1) => {
    let acc = '';
    while (len--) {
      acc += dict[rnd()];
    }
    return acc;
  };
}

const buffer = new Uint16Array(512);
const digit = 16;
let index = buffer.length;
let rnd = 2 ** digit;
let offset = digit;

function random(len: 1 | 2 | 3 | 4 | 5 | 6): number {
  assert(0 < len && len <= 6);
  if (rnd === 2 ** digit) {
    assert(index === buffer.length);
    crypto.getRandomValues(buffer);
    index = 0;
    rnd = buffer[index];
    assert(offset === digit);
  }
  if (offset === len) {
    offset = digit;
    const r = rnd & masks[len];
    rnd = buffer[++index] ?? 2 ** digit;
    return r;
  }
  else if (offset > len) {
    assert(offset > len);
    offset -= len;
    return rnd >> offset & masks[len];
  }
  else {
    assert(offset < len);
    offset = digit;
    rnd = buffer[++index] ?? 2 ** digit;
    return random(len);
  }
}

export function xorshift(seed: number = xorshift.seed()): () => number {
  assert(seed >>> 0 === seed);
  assert(seed >= 1);
  assert(seed <= 2 ** 32 - 1);
  return () => {
    let x = seed;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return seed = x >>> 0;
  };
}
export namespace xorshift {
  const max = -1 >>> 0;
  assert(0 * max + 1 >>> 0 === 1);
  assert(0.9 * max + 1 >>> 0 >= 0);
  assert(0.9 * max + 1 >>> 0 <= max);
  export function seed(): number {
    return Math.random() * max + 1 >>> 0;
  }
  assert(0 / (max + 1) === 0);
  assert(max / (max + 1) < 1);
  export function random(seed?: number): () => number {
    const rnd = xorshift(seed);
    return () => rnd() / (max + 1);
  }
}
