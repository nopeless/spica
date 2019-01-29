import { Sequence } from '../../core';

export default class <a, z> extends Sequence<a, z> {
  public inits(): Sequence<a[], [Sequence.Iterator<a[]>, Sequence.Iterator<a[]>]> {
    return Sequence.mappend(
      Sequence.from([[]]),
      this
        .scanl<a[]>(((b, a) => [...b, a]), [])
        .dropWhile(as => as.length === 0));
  }
}
