import { Array, Uint32Array } from '../global';
import { max, min, floor } from '../alias';
import { Index as Ix } from '../index';

// Circular Indexed List

const undefined = void 0;

export namespace List {
  export interface Node<T> {
    readonly index: number;
    readonly value: T;
    readonly next: number;
    readonly prev: number;
  }
}
export class List<T> {
  constructor(
    public capacity: number,
  ) {
    if (capacity >= 2 ** 32 - 1) throw new Error(`Too large capacity`);
    this.values = Array(this.capacity + 1);
    this.nexts = new Uint32Array(this.capacity + 1);
    this.prevs = new Uint32Array(this.capacity + 1);
    this.ix.pop();
  }
  private values: T[];
  private nexts: Uint32Array;
  private prevs: Uint32Array;
  private readonly ix = new Ix();
  public HEAD = 1;
  private $length = 0;
  public get length() {
    return this.$length;
  }
  public get head(): number {
    return this.HEAD;
  }
  public get tail(): number {
    return this.nexts[this.HEAD];
  }
  public get last(): number {
    return this.prevs[this.HEAD];
  }
  public next(index: number): number {
    return this.nexts[index];
  }
  public prev(index: number): number {
    return this.prevs[index];
  }
  public index(offset: number, index = this.HEAD): number {
    if (offset > 0) {
      for (let map = this.nexts; offset--;) {
        index = map[index];
      }
    }
    else {
      for (let map = this.prevs; offset++;) {
        index = map[index];
      }
    }
    return index;
  }
  public node(index: number): List.Node<T> {
    return {
      index,
      value: this.values[index],
      next: this.nexts[index],
      prev: this.prevs[index],
    };
  }
  public at(index: number): T {
    return this.values[index];
  }
  public isFull() {
    return this.$length === this.capacity;
  }
  public resize(capacity: number): void {
    if (capacity >= 2 ** 32 - 1) throw new Error(`Too large capacity`);
    if (capacity + 1 > this.nexts.length) {
      const nexts = new Uint32Array(max(capacity + 1, min(floor(this.capacity * 1.2), 2 ** 32)));
      nexts.set(this.nexts);
      this.nexts = nexts;
      const prevs = new Uint32Array(max(capacity + 1, min(floor(this.capacity * 1.2), 2 ** 32)));
      prevs.set(this.prevs);
      this.prevs = prevs;
    }
    this.capacity = capacity;
    while (this.$length > capacity) {
      this.del(this.last);
    }
  }
  public clear(): void {
    this.values = Array(this.capacity + 1);
    this.nexts = new Uint32Array(this.capacity + 1);
    this.prevs = new Uint32Array(this.capacity + 1);
    this.ix.clear();
    this.ix.pop();
    this.HEAD = 1;
    this.$length = 0;
  }
  public add(value: T): number {
    const head = this.HEAD;
    //assert(this.length === 0 ? !head : head);
    if (this.$length === 0) {
      assert(this.length === 0);
      const index = this.HEAD = this.ix.pop();
      ++this.$length;
      this.values[index] = value;
      this.nexts[index] = index;
      this.prevs[index] = index;
      //assert(this.length > 10 || [...this].length === this.length);
      return index;
    }
    //assert(head);
    if (this.$length !== this.capacity) {
      assert(this.length < this.capacity);
      const index = this.HEAD = this.ix.pop();
      //assert(!nodes[index]);
      ++this.$length;
      const last = this.prevs[head];
      this.prevs[head] = this.nexts[last] = index;
      this.values[index] = value;
      this.nexts[index] = head;
      this.prevs[index] = last;
      //assert(this.length !== 1 || index === this.nodes[index]!.prev && this.nodes[index]!.prev === this.nodes[index]!.next);
      //assert(this.length !== 2 || index !== this.nodes[index]!.prev && this.nodes[index]!.prev === this.nodes[index]!.next);
      //assert(this.length < 3 || index !== this.nodes[index]!.prev && this.nodes[index]!.prev !== this.nodes[index]!.next);
      //assert(this.length > 10 || [...this].length === this.length);
      return index;
    }
    else {
      assert(this.length === this.capacity);
      assert(this.ix.length - 1 === this.capacity);
      const index = this.HEAD = this.prevs[head];
      //assert(nodes[index]);
      this.values[index] = value;
      //assert(this.length !== 1 || index === this.nodes[index]!.prev && this.nodes[index]!.prev === this.nodes[index]!.next);
      //assert(this.length !== 2 || index !== this.nodes[index]!.prev && this.nodes[index]!.prev === this.nodes[index]!.next);
      //assert(this.length < 3 || index !== this.nodes[index]!.prev && this.nodes[index]!.prev !== this.nodes[index]!.next);
      //assert(this.length > 10 || [...this].length === this.length);
      return index;
    }
  }
  public has(index: number): boolean {
    return this.nexts[index] !== 0;
  }
  public set(index: number, value: T): void {
    this.values[index] = value;
  }
  public del(index: number): void {
    assert(this.length > 0);
    //assert(this.length !== 1 || node === node.prev && node.prev === node.next);
    //assert(this.length !== 2 || node !== node.prev && node.prev === node.next);
    //assert(this.length < 3 || node !== node.prev && node.prev !== node.next);
    const next = this.nexts[index];
    const prev = this.prevs[index];
    this.ix.push(index);
    // @ts-expect-error
    this.values[index] = undefined;
    this.nexts[index] = 0;
    this.prevs[index] = 0;
    if (--this.$length !== 0) {
      this.nexts[prev] = next;
      this.prevs[next] = prev;
    }
    if (this.HEAD === index) {
      this.HEAD = next;
    }
    //assert(this.length === 0 ? !this.nodes[this.HEAD] : this.nodes[this.HEAD]);
    //assert(this.length > 10 || [...this].length === this.length);
  }
  public insert(value: T, before: number): number {
    const head = this.HEAD;
    this.HEAD = before;
    const index = this.add(value);
    this.HEAD = head;
    return index;
  }
  public unshift(value: T): number {
    return this.add(value);
  }
  public unshiftRotationally(value: T): number {
    if (this.$length === 0) return this.unshift(value);
    const index = this.last;
    this.values[index] = value;
    this.HEAD = index;
    return index;
  }
  public push(value: T): number {
    return this.insert(value, this.HEAD);
  }
  public pushRotationally(value: T): number {
    if (this.$length === 0) return this.push(value);
    const index = this.HEAD;
    this.values[index] = value;
    this.HEAD = this.nexts[index];
    return index;
  }
  public shift(): T | undefined {
    if (this.$length === 0) return;
    const index = this.HEAD;
    const value = this.values[index];
    this.del(index);
    return value;
  }
  public pop(): T | undefined {
    if (this.$length === 0) return;
    const index = this.last;
    const value = this.values[index];
    this.del(index);
    return value;
  }
  public move(index: number, before: number): boolean {
    if (index === before) return false;
    const a1 = index;
    const b1 = before;
    assert(a1 !== b1);
    const { nexts, prevs } = this;
    const a2 = nexts[a1];
    if (a2 === b1) return false;
    const b0 = prevs[b1];
    const a0 = prevs[a1];
    nexts[b0] = a1;
    nexts[a1] = b1;
    prevs[b1] = a1;
    prevs[a1] = b0;
    nexts[a0] = a2;
    prevs[a2] = a0;
    assert(this.length > 10 || [...this].length === this.length);
    return true;
  }
  public moveToHead(index: number): void {
    this.move(index, this.HEAD);
    this.HEAD = index;
  }
  public moveToLast(index: number): void {
    this.move(index, this.HEAD);
    this.HEAD = index === this.HEAD
      ? this.tail
      : this.HEAD;
  }
  public swap(index1: number, index2: number): boolean {
    if (index1 === index2) return false;
    const index3 = this.nexts[index2];
    if (index3 === 0) throw new Error(`Invalid index`);
    this.move(index2, index1);
    this.move(index1, index3);
    switch (this.HEAD) {
      case index1:
        this.HEAD = index2;
        break;
      case index2:
        this.HEAD = index1;
        break;
    }
    return true;
  }
  public *[Symbol.iterator](): Iterator<T, undefined, undefined> {
    if (this.$length === 0) return;
    const head = this.HEAD;
    for (let index = head; index;) {
      yield this.values[index];
      index = this.nexts[index] || head;
      if (index === head) return;
    }
  }
}
