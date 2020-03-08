import { Map } from './global';
import { Collection } from './collection';
import { extend } from './assign';
import { indexOf, push, splice } from './array';
import type { DeepImmutable, DeepRequired } from './type';

export interface CacheOptions<K, V = undefined> {
  ignore?: {
    delete?: boolean;
    clear?: boolean;
  };
  data?: {
    stats: [K[], K[]];
    entries: [K, V][];
  };
}

export class Cache<K, V = undefined> implements Collection<K, V> {
  constructor(
    private readonly size: number,
    private readonly callback: (key: K, value: V) => void = () => void 0,
    opts: {
      ignore?: {
        delete?: boolean;
        clear?: boolean;
      };
      data?: {
        stats: [K[], K[]];
        entries: [K, V][];
      };
    } = {},
  ) {
    if (size > 0 === false) throw new Error(`Spica: Cache: Cache size must be greater than 0.`);
    void extend(this.settings, opts);
    const { stats, entries } = this.settings.data;
    const LFU = stats[1].slice(0, size);
    const LRU = stats[0].slice(0, size - LFU.length);
    this.stats = {
      LRU,
      LFU,
    };
    this.store = new Map(entries);
    if (!opts.data) return;
    for (const k of push(stats[1].slice(LFU.length), stats[0].slice(LRU.length))) {
      void this.store.delete(k);
    }
    if (this.store.size !== LFU.length + LRU.length) throw new Error(`Spica: Cache: Size of stats and entries is not matched.`);
    if (![...LFU, ...LRU].every(k => this.store.has(k))) throw new Error(`Spica: Cache: Keys of stats and entries is not matched.`);
  }
  private readonly settings: DeepImmutable<DeepRequired<CacheOptions<K, V>>, unknown[]> = {
    ignore: {
      delete: false,
      clear: false,
    },
    data: {
      stats: [[], []],
      entries: [],
    },
  };
  public put(key: K, value: V, log?: boolean): boolean;
  public put(this: Cache<K, undefined>, key: K, value?: V): boolean;
  public put(key: K, value: V, log = true): boolean {
    if (!log && this.store.has(key)) return void this.store.set(key, value), true;
    if (this.access(key)) return void this.store.set(key, value), true;

    const { LRU, LFU } = this.stats;
    if (LRU.length + LFU.length === this.size && LRU.length < LFU.length) {
      assert(LFU.length > 0);
      const key = LFU.pop()!;
      assert(this.store.has(key));
      const val = this.store.get(key)!;
      void this.store.delete(key);
      void this.callback(key, val);
    }

    void LRU.unshift(key);
    void this.store.set(key, value);

    if (LRU.length + LFU.length > this.size) {
      assert(LRU.length > 0);
      const key = LRU.pop()!;
      assert(this.store.has(key));
      const val = this.store.get(key)!;
      void this.store.delete(key);
      void this.callback(key, val);
    }
    return false;
  }
  public set<W extends V>(this: Cache<K, undefined>, key: K, value?: W): W;
  public set<W extends V>(key: K, value: W, log?: boolean): W;
  public set<W extends V>(key: K, value: W, log?: boolean): W {
    void this.put(key, value, log);
    return value;
  }
  public get(key: K, log = true): V | undefined {
    if (!log) return this.store.get(key);
    void this.access(key);
    return this.store.get(key);
  }
  public has(key: K): boolean {
    return this.store.has(key);
  }
  public delete(key: K): boolean {
    if (!this.store.has(key)) return false;
    const { LRU, LFU } = this.stats;
    for (const stat of [LFU, LRU]) {
      const index = indexOf(stat, key);
      if (index === -1) continue;
      const val = this.store.get(key)!;
      void this.store.delete(splice(stat, index, 1)[0]);
      if (this.settings.ignore.delete) return true;
      void this.callback(key, val);
      return true;
    }
    return false;
  }
  public clear(): void {
    const store = this.store;
    this.store = new Map();
    this.stats = {
      LRU: [],
      LFU: [],
    };
    if (this.settings.ignore.clear) return;
    for (const key of store.keys()) {
      void this.callback(key, store.get(key)!);
    }
  }
  public [Symbol.iterator](): Iterator<[K, V], undefined, undefined> {
    return this.store[Symbol.iterator]();
  }
  public export(): NonNullable<CacheOptions<K, V>['data']> {
    return {
      stats: [this.stats.LRU.slice(), this.stats.LFU.slice()],
      entries: [...this],
    };
  }
  public inspect(): [K[], K[]] {
    const { LRU, LFU } = this.stats;
    return [LRU.slice(), LFU.slice()];
  }
  private store: Map<K, V>;
  private stats: {
    LRU: K[];
    LFU: K[];
  };
  private access(key: K): boolean {
    if (!this.store.has(key)) return false;
    return this.accessLFU(key)
        || this.accessLRU(key);
  }
  private accessLRU(key: K): boolean {
    assert(this.store.has(key));
    const { LRU } = this.stats;
    const index = indexOf(LRU, key);
    if (index === -1) return false;
    const { LFU } = this.stats;
    void LFU.unshift(...splice(LRU, index, 1));
    return true;
  }
  private accessLFU(key: K): boolean {
    assert(this.store.has(key));
    const { LFU } = this.stats;
    const index = indexOf(LFU, key);
    if (index === -1) return false;
    void LFU.unshift(...splice(LFU, index, 1));
    return true;
  }
}
