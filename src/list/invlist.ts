// Circular Inverse List

const undefined = void 0;

const LENGTH = Symbol('length');

type NodeType<T> = Node<T>;
export namespace List {
  export type Node<T> = NodeType<T>;
}
export class List<T> {
  public [LENGTH] = 0;
  public get length(): number {
    return this[LENGTH];
  }
  public head: List.Node<T> | undefined = undefined;
  public get tail(): List.Node<T> | undefined {
    return this.head?.next;
  }
  public get last(): List.Node<T> | undefined {
    return this.head?.prev;
  }
  public clear(): void {
    this.head = undefined;
    this[LENGTH] = 0;
  }
  public unshift(value: T): List.Node<T> {
    return this.head = this.push(value);
  }
  public push(value: T): List.Node<T> {
    return new Node(this, value, this.head!, this.head?.prev!);
  }
  public unshiftNode(node: List.Node<T>): List.Node<T> {
    return this.head = this.pushNode(node);
  }
  public pushNode(node: List.Node<T>): List.Node<T> {
    return this.insert(node, this.head);
  }
  public unshiftRotationally(value: T): List.Node<T> {
    const node = this.last;
    if (!node) return this.unshift(value);
    node.value = value;
    this.head = node;
    return node;
  }
  public pushRotationally(value: T): List.Node<T> {
    const node = this.head;
    if (!node) return this.push(value);
    node.value = value;
    this.head = node.next;
    return node;
  }
  public shift(): T | undefined {
    return this.head?.delete();
  }
  public pop(): T | undefined {
    return this.last?.delete();
  }
  public insert(node: List.Node<T>, before: List.Node<T> | undefined = this.head): List.Node<T> {
    if (node.list === this) return node.moveTo(before), node;
    node.delete();
    ++this[LENGTH];
    this.head ??= node;
    // @ts-expect-error
    node.list = this;
    const next = node.next = before ?? node;
    const prev = node.prev = next.prev ?? node;
    next.prev = prev.next = node;
    return node;
  }
  public find(f: (value: T) => unknown): List.Node<T> | undefined {
    for (let head = this.head, node = head; node;) {
      if (f(node.value)) return node;
      node = node.next;
      if (node === head) break;
    }
  }
  public toNodes(): List.Node<T>[] {
    const acc = [];
    for (let head = this.head, node = head; node;) {
      acc.push(node);
      node = node.next;
      if (node === head) break;
    }
    return acc;
  }
  public toArray(): T[] {
    const acc = [];
    for (let head = this.head, node = head; node;) {
      acc.push(node.value);
      node = node.next;
      if (node === head) break;
    }
    return acc;
  }
  public *[Symbol.iterator](): Iterator<T, undefined, undefined> {
    for (let head = this.head, node = head; node;) {
      yield node.value;
      node = node.next;
      if (node === head) return;
    }
  }
}

class Node<T> {
  constructor(
    public readonly list: List<T>,
    public value: T,
    public next: Node<T>,
    public prev: Node<T>,
  ) {
    ++list[LENGTH];
    list.head ??= this;
    next && prev
      ? next.prev = prev.next = this
      : this.next = this.prev = this;
  }
  public delete(): T {
    if (!this.list) return this.value;
    --this.list[LENGTH];
    const { next, prev } = this;
    if (this.list.head === this) {
      this.list.head = next === this
        ? undefined
        : next;
    }
    if (next) {
      next.prev = prev;
    }
    if (prev) {
      prev.next = next;
    }
    // @ts-expect-error
    this.list = undefined;
    // @ts-expect-error
    this.next = this.prev = undefined;
    return this.value;
  }
  public insertBefore(value: T): Node<T> {
    return new Node(this.list, value, this, this.prev);
  }
  public insertAfter(value: T): Node<T> {
    return new Node(this.list, value, this.next, this);
  }
  public moveTo(before: Node<T> | undefined): boolean {
    if (!before) return false;
    if (this === before) return false;
    if (before.list !== this.list) return before.list.insert(this, before), true;
    const a1 = this;
    const b1 = before;
    if (a1.next === b1) return false;
    const b0 = b1.prev;
    const a0 = a1.prev;
    const a2 = a1.next;
    b0.next = a1;
    a1.next = b1;
    b1.prev = a1;
    a1.prev = b0;
    a0.next = a2;
    a2.prev = a0;
    return true;
  }
  public moveToHead(): void {
    this.moveTo(this.list.head);
    this.list.head = this;
  }
  public moveToLast(): void {
    this.moveTo(this.list.head);
  }
  public swap(node: Node<T>): boolean {
    const node1 = this;
    const node2 = node;
    if (node1 === node2) return false;
    const node3 = node2.next;
    if (node1.list !== node2.list) throw new Error(`Spica: InvList: Cannot swap nodes across lists.`);
    node2.moveTo(node1);
    node1.moveTo(node3);
    switch (this.list.head) {
      case node1:
        this.list.head = node2;
        break;
      case node2:
        this.list.head = node1;
        break;
    }
    return true;
  }
}
