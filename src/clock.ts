import { Date } from './global';
import { Queue } from './queue';
import { duff } from './duff';
import { causeAsyncException } from './exception';

let mem: number | undefined;
let count = 0;
export function now(nocache = false): number {
  if (mem === void 0) {
    tick(() => mem = void 0);
  }
  else if (!nocache && ++count !== 100) {
    return mem;
  }
  count = 0;
  return mem = Date.now();
}

export const clock: Promise<undefined> = Promise.resolve(void 0);

type Callback = () => void;
const queue = new Queue<Callback>();
const scheduler = Promise.resolve();

export function tick(cb: Callback): void {
  queue.isEmpty() && scheduler.then(run);
  queue.push(cb);
}

function run(): void {
  duff(queue.length, () => {
    try {
      // @ts-expect-error
      (0, queue.pop()!)();
    }
    catch (reason) {
      causeAsyncException(reason);
    }
  });
}
