export abstract class Lazy<T> {
  constructor(protected thunk?: () => Lazy<T>) {
  }
  protected memory_: this;
  protected evaluate(): this {
    return this.memory_ = this.memory_ || <this>this.thunk();
  }
}
