import {Sequence} from '../../../sequence';

describe('Unit: lib/monad/sequence/member/static/difference', () => {
  const nat = new Sequence<number, number>((n = 0, cons) => cons(n, n + 1));
  const double = nat.map(n => n * 2);
  const triple = nat.map(n => n * 3);

  describe('Sequence.difference', () => {
    it('unlimited', () => {
      assert.deepStrictEqual(
        Sequence.difference(double, triple, (a, b) => a - b).take(7).read(),
        [2, 3, 4, 8, 9, 10, 14]);
      assert.deepStrictEqual(
        Sequence.difference(double.map(n => -n), triple.map(n => -n), (a, b) => b - a).take(7).read(),
        [2, 3, 4, 8, 9, 10, 14].map(n => -n));
    });

    it('same', () => {
      assert.deepStrictEqual(
        Sequence.difference(double, triple, (a, b) => a - b).take(7).read(),
        [2, 3, 4, 8, 9, 10, 14]);
      assert.deepStrictEqual(
        Sequence.difference(double.map(n => -n), triple.map(n => -n), (a, b) => b - a).take(7).read(),
        [2, 3, 4, 8, 9, 10, 14].map(n => -n));
    });

    it('mismatch', () => {
      assert.deepStrictEqual(
        Sequence.difference(double.dropWhile(n => n < 6).takeUntil(n => n === 12), triple, (a, b) => a - b).take(8).read(),
        [0, 3, 8, 9, 10, 15, 18, 21]);
      assert.deepStrictEqual(
        Sequence.difference(triple, double.dropWhile(n => n < 6).takeUntil(n => n === 12), (a, b) => a - b).take(8).read(),
        [0, 3, 8, 9, 10, 15, 18, 21]);
    });

    it('empty', () => {
      assert.deepStrictEqual(
        Sequence.difference(nat, Sequence.from([]), (a, b) => a - b).take(3).read(),
        [0, 1, 2]);
      assert.deepStrictEqual(
        Sequence.difference(Sequence.from([]), nat, (a, b) => a - b).take(3).read(),
        [0, 1, 2]);
      assert.deepStrictEqual(
        Sequence.difference(Sequence.from([]), Sequence.from([]), (a, b) => a - b).take(3).read(),
        []);
    });

  });

});
