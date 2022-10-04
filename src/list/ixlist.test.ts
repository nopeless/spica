import { List } from './ixlist';

describe('Unit: lib/ixlist', () => {
  describe('List', () => {
    function inspect<K, V>(list: List<K, V>) {
      return {
        list: [...list],
        head: list.HEAD,
        cursor: list['CURSOR'],
        length: list.length,
      };
    }

    it('add/delete 1', () => {
      const list = new List<number>(1);

      assert.deepStrictEqual(inspect(list), {
        list: [],
        head: 0,
        cursor: 0,
        length: 0,
      });

      assert(list.add(0) === 0);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [0, undefined, 0],
        ],
        head: 0,
        cursor: 0,
        length: 1,
      });

      assert(list.add(1) === 0);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [1, undefined, 0],
        ],
        head: 0,
        cursor: 0,
        length: 1,
      });

      assert(list.add(1) === 0);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [1, undefined, 0],
        ],
        head: 0,
        cursor: 0,
        length: 1,
      });

      assert.deepStrictEqual(list.delete(1), undefined);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [1, undefined, 0],
        ],
        head: 0,
        cursor: 0,
        length: 1,
      });

      assert.deepStrictEqual(list.delete(0), { index: 0, key: 1, value: undefined, next: 0, prev: 0 });
      assert.deepStrictEqual(inspect(list), {
        list: [],
        head: 0,
        cursor: 0,
        length: 0,
      });

      assert.deepStrictEqual(list.delete(0), undefined);
      assert.deepStrictEqual(inspect(list), {
        list: [],
        head: 0,
        cursor: 0,
        length: 0,
      });
    });

    it('add/delete 2', () => {
      const list = new List<number>(2);

      assert(list.add(0) === 0);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [0, undefined, 0],
        ],
        head: 0,
        cursor: 0,
        length: 1,
      });

      assert(list.add(1) === 1);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [1, undefined, 1],
          [0, undefined, 0],
        ],
        head: 1,
        cursor: 1,
        length: 2,
      });

      assert(list.add(1) === 0);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [1, undefined, 0],
          [1, undefined, 1],
        ],
        head: 0,
        cursor: 0,
        length: 2,
      });

      assert.deepStrictEqual(list.delete(0), { index: 0, key: 1, value: undefined, next: 1, prev: 1 });
      assert.deepStrictEqual(inspect(list), {
        list: [
          [1, undefined, 1],
        ],
        head: 1,
        cursor: 1,
        length: 1,
      });

      assert.deepStrictEqual(list.delete(1), { index: 1, key: 1, value: undefined, next: 1, prev: 1 });
      assert.deepStrictEqual(inspect(list), {
        list: [],
        head: 1,
        cursor: 1,
        length: 0,
      });
    });

    it('add/delete 3', () => {
      const list = new List<number>(3);

      assert(list.add(0) === 0);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [0, undefined, 0],
        ],
        head: 0,
        cursor: 0,
        length: 1,
      });

      assert(list.add(1) === 1);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [1, undefined, 1],
          [0, undefined, 0],
        ],
        head: 1,
        cursor: 1,
        length: 2,
      });

      assert(list.add(2) === 2);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [2, undefined, 2],
          [1, undefined, 1],
          [0, undefined, 0],
        ],
        head: 2,
        cursor: 2,
        length: 3,
      });

      assert(list.add(3) === 0);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [3, undefined, 0],
          [2, undefined, 2],
          [1, undefined, 1],
        ],
        head: 0,
        cursor: 0,
        length: 3,
      });

      assert.deepStrictEqual(list.delete(1), { index: 1, key: 1, value: undefined, next: 0, prev: 2 });
      assert.deepStrictEqual(inspect(list), {
        list: [
          [3, undefined, 0],
          [2, undefined, 2],
        ],
        head: 0,
        cursor: 0,
        length: 2,
      });
    });

    it('insert', () => {
      const list = new List<number, number>(2);

      assert(list.insert(0, ~0, 0) === 0);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [0, ~0, 0],
        ],
        head: 0,
        cursor: 0,
        length: 1,
      });

      assert(list.insert(1, ~1, 0) === 1);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [0, ~0, 0],
          [1, ~1, 1],
        ],
        head: 0,
        cursor: 1,
        length: 2,
      });

      assert(list.insert(2, ~2, 0) === 1);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [0, ~0, 0],
          [2, ~2, 1],
        ],
        head: 0,
        cursor: 1,
        length: 2,
      });
    });

    it('swap', () => {
      const list = new List<number, number>(4);

      list.add(0, ~0);
      list.add(1, ~1);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [1, ~1, 1],
          [0, ~0, 0],
        ],
        head: 1,
        cursor: 1,
        length: 2,
      });

      list.swap(0, 1);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [0, ~0, 0],
          [1, ~1, 1],
        ],
        head: 0,
        cursor: 1,
        length: 2,
      });

      list.add(2, ~2);
      list.add(3, ~3);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [3, ~3, 3],
          [2, ~2, 2],
          [0, ~0, 0],
          [1, ~1, 1],
        ],
        head: 3,
        cursor: 3,
        length: 4,
      });

      list.swap(0, 3);
      assert.deepStrictEqual(inspect(list), {
        list: [
          [0, ~0, 0],
          [2, ~2, 2],
          [3, ~3, 3],
          [1, ~1, 1],
        ],
        head: 0,
        cursor: 3,
        length: 4,
      });
    });

  });

});
