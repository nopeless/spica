import { AtomicPromise } from './promise';
import { AtomicFuture } from './future'; 
import { Cancellation } from './cancellation';
import { DeepRequired } from './type';
import { extend } from './assign';
import { tuple } from './tuple';
import { clock, tick } from './clock';
import { noop } from './noop';

const run = Symbol();
const port = Symbol();
const destructor = Symbol();
const terminator = Symbol();

export interface CoroutineOptions {
  readonly resume?: () => PromiseLike<void>;
  readonly size?: number;
  readonly autorun?: boolean;
}
interface CoroutinePort<_T, R, S> {
  //readonly send: (msg: S | PromiseLike<S>) => AtomicPromise<IteratorResult<R, T>>;
  readonly send: (msg: S | PromiseLike<S>) => AtomicPromise<IteratorResult<R>>;
  //readonly recv: () => AtomicPromise<IteratorResult<R, T>>;
  readonly recv: () => AtomicPromise<IteratorResult<R>>;
  //readonly connect: <U>(com: () => Iterator<S, U> | AsyncIterator<S, U>) => Promise<U>;
  readonly connect: (com: () => Iterator<S> | AsyncIterator<S>) => Promise<unknown>;
}
type Reply<R> = (msg: IteratorResult<R> | Promise<never>) => void;

export class Coroutine<T, R = void, S = void> extends AtomicPromise<T> implements AsyncIterable<R> {
  protected static readonly run: typeof run = run;
  public static readonly port: typeof port = port;
  protected static readonly destructor: typeof destructor = destructor;
  public static readonly terminator: typeof terminator = terminator;
  public static get [Symbol.species]() {
    return AtomicPromise;
  }
  constructor(
    gen: (this: Coroutine<T, R, S>) => Iterator<T | R> | AsyncIterator<T | R>,
    opts: CoroutineOptions = {},
  ) {
    super(resolve => res = resolve);
    var res!: (v: T | AtomicPromise<never>) => void;
    void this.result.register(res);
    void this.result.register(() => void this[Coroutine.destructor]());
    void Object.freeze(extend(this.settings, opts));
    this[Coroutine.run] = async () => {
      try {
        this[Coroutine.run] = noop;
        const resume = (): AtomicPromise<[S, Reply<R>]> =>
          this.msgs.length > 0
            ? AtomicPromise.all(this.msgs.shift()!)
            : this.resume.then(resume);
        const iter = gen.call(this) as ReturnType<typeof gen>;
        let cnt = 0;
        while (this.alive) {
          void ++cnt;
          const [[msg, reply]] = cnt === 1
            // Don't block.
            ? [[undefined as S | undefined, noop as Reply<R>]]
            // Block.
            : await AtomicPromise.all([
                // Don't block.
                this.settings.size === 0
                  ? AtomicPromise.resolve(tuple([undefined as S | undefined, noop as Reply<R>]))
                  : resume(),
                // Don't block.
                this.settings.resume(),
              ]);
          assert(msg instanceof Promise === false);
          assert(msg instanceof AtomicPromise === false);
          // Block.
          const { value, done } = await iter.next(msg);
          assert(value instanceof Promise === false);
          assert(value instanceof AtomicPromise === false);
          if (!this.alive) return;
          if (!done) {
            // Don't block.
            const state = this.state.bind({ value: value as R, done });
            assert(state === this.state);
            this.state = new AtomicFuture();
            // Block.
            await state;
            // Don't block.
            void reply({ value: value as R, done });
            continue;
          }
          else {
            this.alive = false;
            // Block.
            void this.state.bind({ value: value as any as R, done });
            void reply({ value: value as any as R, done });
            void this.result.cancel(value as T);
            while (this.msgs.length > 0) {
              // Don't block.
              const [, reply] = this.msgs.shift()!;
              void reply(AtomicPromise.reject(new Error(`Spica: Coroutine: Canceled.`)));
            }
          }
        }
      }
      catch (reason) {
        void this[Coroutine.terminator](reason);
      }
    };
    this.settings.autorun
      ? void this[Coroutine.run]()
      : void tick(() => void this[Coroutine.run]());
  }
  protected [run]: () => void;
  private alive = true;
  private state = new AtomicFuture<IteratorResult<R>>();
  private resume = new AtomicFuture();
  private readonly result: Cancellation<T | AtomicPromise<never>> = new Cancellation();
  private readonly msgs: [S | PromiseLike<S>, Reply<R>][] = [];
  private readonly settings: DeepRequired<CoroutineOptions> = {
    resume: () => clock,
    size: 0,
    autorun: true,
  };
  public async *[Symbol.asyncIterator](): AsyncIterableIterator<R> {
    while (this.alive) {
      const { value, done } = await this.state;
      assert(value instanceof Promise === false);
      assert(value instanceof AtomicPromise === false);
      if (done || this.result.canceled) return;
      yield value;
    }
  }
  public readonly [port]: CoroutinePort<T, R, S> = {
    recv: () => this.state,
    send: (msg: S | PromiseLike<S>): AtomicPromise<IteratorResult<R>> => {
      if (!this.alive) return AtomicPromise.reject(new Error(`Spica: Coroutine: Canceled.`));
      const res = new AtomicFuture<IteratorResult<R>>();
      // Don't block.
      void this.msgs.push([msg, res.bind]);
      void this.resume.bind(undefined);
      this.resume = new AtomicFuture();
      while (this.msgs.length > this.settings.size) {
        // Don't block.
        const [, reply] = this.msgs.shift()!;
        void reply(AtomicPromise.reject(new Error(`Spica: Coroutine: Overflowed.`)));
      }
      return res.then();
    },
    connect: async (com: () => Iterator<S> | AsyncIterator<S>): Promise<unknown> => {
      const iter = com();
      let reply: T | R | undefined;
      while (true) {
        const msg = await iter.next(reply!);
        if (msg.done) return msg.value;
        const rpy = await this[port].send(msg.value);
        reply = rpy.value;
      }
    },
  };
  public readonly [terminator]: (reason?: any) => void = reason => {
    if (!this.alive) return;
    this.alive = false;
    // Don't block.
    void this.state.bind({ value: undefined as any as R, done: true });
    void this.result.cancel(AtomicPromise.reject(reason));
    while (this.msgs.length > 0) {
      // Don't block.
      const [, reply] = this.msgs.shift()!;
      void reply(AtomicPromise.reject(new Error(`Spica: Coroutine: Canceled.`)));
    }
  };
  protected [destructor]: () => void = noop;
}
