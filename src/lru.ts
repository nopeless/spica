import { IterableDict } from './dict';
import { List } from './list';

class Node<K, V> {
  constructor(
    public key: K,
    public value: V,
  ) {
  }
  public next?: this = undefined;
  public prev?: this = undefined;
}

export class LRU<K, V> implements IterableDict<K, V> {
  constructor(
    private capacity: number,
  ) {
  }
  private readonly dict = new Map<K, Node<K, V>>();
  private readonly list = new List<Node<K, V>>();
  public get length(): number {
    return this.list.length;
  }
  public get size(): number {
    return this.list.length;
  }
  private evict(): void {
    const { dict, list } = this;
    assert(list.length > 0);
    const node = list.pop()!;
    dict.delete(node.key);
  }
  private replace(key: K, value: V): void {
    const { dict, list } = this;
    const node = list.head!.prev!;
    dict.delete(node.key);
    dict.set(key, node);
    list.head = node;
    node.key = key;
    node.value = value;
  }
  public set(key: K, value: V): this {
    const { dict, list } = this;
    const node = dict.get(key);
    if (node === undefined) {
      if (list.length === this.capacity) {
        this.replace(key, value);
      }
      else {
        const node = new Node(key, value);
        dict.set(key, node);
        list.unshift(node);
      }
    }
    else {
      node.value = value;
    }
    assert(this.dict.size <= this.capacity);
    assert(this.list.length <= this.capacity);
    return this;
  }
  public get(key: K): V | undefined {
    const { dict, list } = this;
    const node = dict.get(key);
    if (node === undefined) return;
    if (node !== list.head) {
      list.delete(node);
      list.unshift(node);
    }
    return node.value;
  }
  public has(key: K): boolean {
    return this.dict.has(key);
  }
  public delete(key: K): boolean {
    const { dict, list } = this;
    const node = dict.get(key);
    if (node === undefined) return false;
    list.delete(node);
    return dict.delete(key);
  }
  public clear(): void {
    this.dict.clear();
    this.list.clear();
  }
  public resize(capacity: number): void {
    this.capacity = capacity;
    while (this.list.length > this.capacity) {
      this.evict();
    }
  }
  public *[Symbol.iterator](): Iterator<[K, V], undefined, undefined> {
    for (const { key, value } of this.list) {
      yield [key, value];
    }
    return;
  }
}
