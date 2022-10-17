import { min } from './alias';
import { List as InvList } from './invlist';
import { memoize } from './memoize';

// Max heap

export namespace Heap {
  export interface Options {
    stable?: boolean;
  }
}
export class Heap<T, O = T> {
  public static readonly max = <O>(a: O, b: O): number => a > b ? -1 : a < b ? 1 : 0;
  public static readonly min = <O>(a: O, b: O): number => a > b ? 1 : a < b ? -1 : 0;
  constructor(
    private readonly cmp: (a: O, b: O) => number = Heap.max,
    options?: Heap.Options,
  ) {
    this.stable = options?.stable ?? false;
    this.array = new List();
  }
  private readonly stable: boolean;
  private readonly array: List<T, O>;
  public get length(): number {
    return this.array.length;
  }
  public isEmpty(): boolean {
    return this.array.length === 0;
  }
  public peek(): T | undefined {
    return this.array.value(this.array.index(0));
  }
  public insert(this: Heap<T, T>, value: T): number;
  public insert(value: T, order: O): number;
  public insert(value: T, order?: O): number {
    if (arguments.length < 2) {
      order = value as any;
    }
    assert([order = order!]);
    const index = this.array.push(value, order);
    upHeapify(this.cmp, this.array, this.length);
    return index;
  }
  public replace(this: Heap<T, T>, value: T): T | undefined;
  public replace(value: T, order: O): T | undefined;
  public replace(value: T, order?: O): T | undefined {
    if (arguments.length < 2) {
      order = value as any;
    }
    assert([order = order!]);
    if (this.length === 0) return void this.insert(value, order);
    const replaced = this.peek();
    const index = this.array.index(0);
    this.array.setValue(index, value);
    this.array.setOrder(index, order);
    downHeapify(this.cmp, this.array, 1, this.length, this.stable);
    return replaced;
  }
  public extract(): T | undefined {
    if (this.length === 0) return;
    const value = this.peek();
    this.del(0);
    return value;
  }
  private del(pos: number): void {
    swap(this.array, pos + 1, this.length);
    this.array.pop();
    sort(this.cmp, this.array, pos + 1, this.length, this.stable);
  }
  public delete(index: number): T {
    const value = this.array.value(index);
    this.del(this.array.position(index));
    return value;
  }
  public update(index: number, order: O, value?: T): void {
    const ord = this.array.order(index);
    assert([order = order!]);
    this.array.setOrder(index, order);
    if (arguments.length >= 3) {
      this.array.setValue(index, value!);
    }
    if (this.cmp(ord, order) === 0) return;
    sort(this.cmp, this.array, this.array.position(index) + 1, this.length, this.stable);
  }
  public clear(): void {
    this.array.clear();
  }
}

function sort<T, O>(
  cmp: (a: O, b: O) => number,
  array: List<T, O>,
  index: number,
  length: number,
  stable: boolean,
): boolean {
  assert(index);
  if (length === 0) return false;
  switch (index) {
    case 1:
      return false
        || downHeapify(cmp, array, index, length, stable);
    case length:
      return upHeapify(cmp, array, index);
    default:
      return upHeapify(cmp, array, index)
        || downHeapify(cmp, array, index, length, stable);
  }
}

function upHeapify<T, O>(
  cmp: (a: O, b: O) => number,
  array: List<T, O>,
  index: number,
): boolean {
  assert(index);
  const order = array.ord(index - 1);
  let changed = false;
  while (index > 1) {
    const parent = index / 2 | 0;
    if (cmp(array.ord(parent - 1), order) <= 0) break;
    swap(array, index, parent);
    index = parent;
    changed ||= true;
  }
  return changed;
}

function downHeapify<T, O>(
  cmp: (a: O, b: O) => number,
  array: List<T, O>,
  index: number,
  length: number,
  stable: boolean,
): boolean {
  assert(index);
  let changed = false;
  while (index < length) {
    const left = index * 2;
    const right = index * 2 + 1;
    let min = index;
    if (left <= length) {
      const result = cmp(array.ord(left - 1), array.ord(min - 1));
      if (stable ? result <= 0 : result < 0) {
        min = left;
      }
    }
    if (right <= length) {
      const result = cmp(array.ord(right - 1), array.ord(min - 1));
      if (stable ? result <= 0 : result < 0) {
        min = right;
      }
    }
    if (min === index) break;
    swap(array, index, min);
    index = min;
    changed ||= true;
  }
  return changed;
}

function swap<T, O>(array: List<T, O>, index1: number, index2: number): void {
  assert(index1 && index2);
  array.swap(index1 - 1, index2 - 1);
}

class List<T, O> {
  private capacity = 4;
  private orders: O[] = Array(this.capacity);
  private values: T[] = Array(this.capacity);
  private indexes = new Uint32Array(this.capacity);
  private positions = new Uint32Array(this.capacity);
  private $length = 0;
  public get length() {
    return this.$length;
  }
  public index(pos: number): number {
    return this.indexes[pos];
  }
  public position(index: number): number {
    return this.positions[index];
  }
  public ord(pos: number): O {
    return this.orders[this.indexes[pos]];
  }
  public order(index: number): O {
    return this.orders[index];
  }
  public value(index: number): T {
    return this.values[index];
  }
  private isFull(): boolean {
    return this.$length === this.capacity;
  }
  private extend(): void {
    if (this.capacity === 2 ** 32) throw new Error(`Too large capacity`);
    const capacity = min(this.capacity * 2, 2 ** 32);
    assert(capacity > this.indexes.length);
    this.orders.length = capacity;
    this.values.length = capacity;
    const indexes = new Uint32Array(capacity);
    indexes.set(this.indexes);
    this.indexes = indexes;
    const positions = new Uint32Array(capacity);
    positions.set(this.positions);
    this.positions = positions;
    this.capacity = capacity;
  }
  public clear(): void {
    this.orders = Array(this.capacity);
    this.values = Array(this.capacity);
    this.$length = 0;
  }
  public setValue(index: number, value: T): void {
    this.values[index] = value;
  }
  public setOrder(index: number, order: O): void {
    this.orders[index] = order;
  }
  public push(value: T, order: O): number {
    this.isFull() && this.extend();
    const pos = this.$length++;
    this.indexes[pos] = pos;
    this.positions[pos] = pos;
    this.values[pos] = value;
    this.orders[pos] = order;
    return pos;
  }
  public pop(): void {
    if (this.$length === 0) return;
    const pos = this.indexes[--this.$length];
    this.values[pos] = undefined as any;
    this.orders[pos] = undefined as any;
  }
  public swap(pos1: number, pos2: number): boolean {
    if (pos1 === pos2) return false;
    const { indexes, positions } = this;
    const idx1 = indexes[pos1];
    const idx2 = indexes[pos2];
    indexes[pos1] = idx2;
    indexes[pos2] = idx1;
    assert(positions[idx1] === pos1);
    assert(positions[idx2] === pos2);
    positions[idx1] = pos2;
    positions[idx2] = pos1;
    return true;
  }
  public *[Symbol.iterator](): Iterator<[O, T, number], undefined, undefined> {
    if (this.$length === 0) return;
    for (let i = 0; i < this.$length; ++i) {
      const index = this.indexes[i];
      yield [this.orders[index], this.values[index], i];
    }
  }
}

type MultiNode<T> = InvList.Node<T>;

// 1e6要素で落ちるため実用不可
export namespace MultiHeap {
  export type Node<T, O = T> = InvList.Node<T> | { _: [T, O]; };
  export interface Options {
    clean?: boolean;
  }
}
export class MultiHeap<T, O = T> {
  private static readonly order = Symbol('order');
  private static readonly heap = Symbol('heap');
  public static readonly max = Heap.max;
  public static readonly min = Heap.min;
  constructor(
    private readonly cmp: (a: O, b: O) => number = MultiHeap.max,
    options?: MultiHeap.Options,
  ) {
    this.clean = options?.clean ?? true;
    this.heap = new Heap(this.cmp);
  }
  private readonly clean: boolean;
  private readonly heap: Heap<InvList<T>, O>;
  private readonly dict = new Map<O, InvList<T>>();
  private readonly list = memoize<O, InvList<T>>(order => {
    const list = new InvList<T>();
    list[MultiHeap.order] = order;
    list[MultiHeap.heap] = this.heap.insert(list, order);
    return list;
  }, this.dict);
  private $length = 0;
  public get length(): number {
    return this.$length;
  }
  public isEmpty(): boolean {
    return this.heap.isEmpty();
  }
  public peek(): T | undefined {
    return this.heap.peek()?.head!.value;
  }
  public insert(this: MultiHeap<T, T>, value: T): MultiHeap.Node<T, O>;
  public insert(value: T, order: O): MultiHeap.Node<T, O>;
  public insert(value: T, order?: O): MultiNode<T> {
    if (arguments.length < 2) {
      order = value as any;
    }
    assert([order = order!]);
    ++this.$length;
    return this.list(order).push(value);
  }
  public extract(): T | undefined {
    if (this.$length === 0) return;
    --this.$length;
    const list = this.heap.peek()!;
    const value = list.shift();
    if (list.length === 0) {
      this.heap.extract();
      this.clean && this.dict.delete(list[MultiHeap.order]);
    }
    return value;
  }
  public delete(node: MultiHeap.Node<T, O>): T;
  public delete(node: MultiNode<T>): T {
    const list = node.list;
    if (!list) throw new Error('Invalid node');
    --this.$length;
    if (list.length === 1) {
      this.heap.delete(list[MultiHeap.heap]);
      this.clean && this.dict.delete(list[MultiHeap.order]);
    }
    return node.delete();
  }
  public update(this: MultiHeap<T, T>, node: MultiHeap.Node<T, O>): MultiHeap.Node<T, O>;
  public update(node: MultiHeap.Node<T, O>, order: O, value?: T): MultiHeap.Node<T, O>;
  public update(node: MultiNode<T>, order?: O, value?: T): MultiHeap.Node<T, O> {
    const list = node.list;
    if (!list) throw new Error('Invalid node');
    if (arguments.length < 2) {
      order = list[MultiHeap.order];
    }
    assert([order = order!]);
    if (arguments.length > 2) {
      node.value = value!;
    }
    if (this.cmp(list[MultiHeap.order], order) === 0) return node;
    this.delete(node);
    return this.insert(node.value, order);
  }
  public find(order: O): InvList<T> | undefined {
    return this.dict.get(order);
  }
  public clear(): void {
    this.heap.clear();
    this.dict.clear();
    this.$length = 0;
  }
}
