import { benchmark } from './benchmark';
import { List as InvList } from '../src/invlist';
import { List as IxList } from '../src/ixlist';
import { List } from '../src/list';
import Yallist from 'yallist';

class Node {
  constructor(public value: number) { }
  public next?: this = undefined;
  public prev?: this = undefined;
}

describe('Benchmark:', function () {
  describe('List', function () {
    it('Yallist new', function (done) {
      benchmark('Yallist new', () => Yallist.create(), done);
    });

    it('List    new', function (done) {
      benchmark('List    new', () => new List(), done);
    });

    it('InvList new', function (done) {
      benchmark('InvList new', () => new InvList(), done);
    });

    it('IxList  new', function (done) {
      benchmark('IxList  new', () => new IxList(), done);
    });

    for (const length of [1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7]) {
      it(`Yallist add ${length.toLocaleString('en')}`, function (done) {
        const list = new Yallist();
        for (let i = 0; i < length; ++i) list.push(0);
        benchmark(`Yallist add ${length.toLocaleString('en')}`, () => {
          list.shift();
          list.push(0);
        }, done);
      });

      it(`List    add ${length.toLocaleString('en')}`, function (done) {
        const list = new List();
        for (let i = 0; i < length; ++i) list.push(new Node(0));
        benchmark(`List    add ${length.toLocaleString('en')}`, () => {
          list.shift();
          list.push(new Node(0));
        }, done);
      });

      it(`InvList add ${length.toLocaleString('en')}`, function (done) {
        const list = new InvList();
        for (let i = 0; i < length; ++i) list.push(0);
        benchmark(`InvList add ${length.toLocaleString('en')}`, () => {
          list.shift();
          list.push(0);
        }, done);
      });

      it(`InvList add rotationally ${length.toLocaleString('en')}`, function (done) {
        const list = new InvList();
        for (let i = 0; i < length; ++i) list.push(0);
        benchmark(`InvList add rotationally ${length.toLocaleString('en')}`, () => {
          list.pushRotationally(0);
        }, done);
      });

      it(`IxList  add ${length.toLocaleString('en')}`, function (done) {
        const list = new IxList();
        for (let i = 0; i < length; ++i) list.push(0);
        benchmark(`IxList  add ${length.toLocaleString('en')}`, () => {
          list.shift();
          list.push(0);
        }, done);
      });

      it(`IxList  add rotationally ${length.toLocaleString('en')}`, function (done) {
        const list = new IxList();
        for (let i = 0; i < length; ++i) list.push(0);
        benchmark(`IxList  add rotationally ${length.toLocaleString('en')}`, () => {
          list.pushRotationally(0);
        }, done);
      });

      it(`IxList  add with constraint ${length.toLocaleString('en')}`, function (done) {
        const list = new IxList(length);
        for (let i = 0; i < length; ++i) list.push(0);
        benchmark(`IxList  add with constraint ${length.toLocaleString('en')}`, () => {
          list.push(0);
        }, done);
      });
    }

    for (const length of [1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7]) {
      it(`Yallist access ${length.toLocaleString('en')}`, function (done) {
        const list = new Yallist<Node>();
        for (let i = 0; i < length; ++i) list.push(new Node(0));
        benchmark(`Yallist access ${length.toLocaleString('en')}`, () => {
          list.shift()?.value;
          list.push(new Node(0));
        }, done);
      });

      it(`List    access ${length.toLocaleString('en')}`, function (done) {
        const list = new List<Node>();
        for (let i = 0; i < length; ++i) list.push(new Node(0));
        benchmark(`List    access ${length.toLocaleString('en')}`, () => {
          list.shift()?.value;
          list.push(new Node(0));
        }, done);
      });

      it(`InvList access ${length.toLocaleString('en')}`, function (done) {
        const list = new InvList<Node>();
        for (let i = 0; i < length; ++i) list.push(new Node(0));
        benchmark(`InvList access ${length.toLocaleString('en')}`, () => {
          list.shift()?.value;
          list.push(new Node(0));
        }, done);
      });

      it(`InvList access rotationally ${length.toLocaleString('en')}`, function (done) {
        const list = new InvList<Node>();
        for (let i = 0; i < length; ++i) list.push(new Node(0));
        benchmark(`InvList access rotationally ${length.toLocaleString('en')}`, () => {
          list.last?.value.value;
          list.pushRotationally(new Node(0));
        }, done);
      });

      it(`IxList  access ${length.toLocaleString('en')}`, function (done) {
        const list = new IxList<Node>();
        for (let i = 0; i < length; ++i) list.push(new Node(0));
        benchmark(`IxList  access ${length.toLocaleString('en')}`, () => {
          list.shift()?.value;
          list.push(new Node(0));
        }, done);
      });

      it(`IxList  access rotationally ${length.toLocaleString('en')}`, function (done) {
        const list = new IxList<Node>();
        for (let i = 0; i < length; ++i) list.push(new Node(0));
        benchmark(`IxList  access rotationally ${length.toLocaleString('en')}`, () => {
          list.last;
          list.pushRotationally(new Node(0));
        }, done);
      });

      it(`IxList  access with constraint ${length.toLocaleString('en')}`, function (done) {
        const list = new IxList<Node>(length);
        for (let i = 0; i < length; ++i) list.push(new Node(0));
        benchmark(`IxList  access with constraint ${length.toLocaleString('en')}`, () => {
          list.last;
          list.push(new Node(0));
        }, done);
      });
    }

    for (const length of [1e1, 1e2, 1e3, 1e4, 1e5, 1e6]) {
      it(`Yallist move ${length.toLocaleString('en')}`, function (done) {
        const list = new Yallist();
        for (let i = 0; i < length; ++i) list.push(0);
        benchmark(`Yallist move ${length.toLocaleString('en')}`, () => {
          list.unshiftNode(list.tail!.prev!);
        }, done);
      });

      it(`List    move ${length.toLocaleString('en')}`, function (done) {
        const list = new List();
        for (let i = 0; i < length; ++i) list.push(new Node(0));
        benchmark(`List    move ${length.toLocaleString('en')}`, () => {
          const node = list.head?.prev?.prev!;
          list.delete(node);
          list.unshift(node);
        }, done);
      });

      it(`InvList move ${length.toLocaleString('en')}`, function (done) {
        const list = new InvList();
        for (let i = 0; i < length; ++i) list.push(0);
        benchmark(`InvList move ${length.toLocaleString('en')}`, () => {
          list.last!.prev.moveToHead();
        }, done);
      });

      it(`IxList  move ${length.toLocaleString('en')}`, function (done) {
        const list = new IxList(length);
        for (let i = 0; i < length; ++i) list.push(0);
        benchmark(`IxList  move ${length.toLocaleString('en')}`, () => {
          list.moveToHead(list.prev(list.last));
        }, done);
      });
    }

  });

});
