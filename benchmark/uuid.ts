import { benchmark } from './benchmark';
import { uuid } from '../src/uuid';

describe('Benchmark:', function () {
  this.timeout(10 * 1e3);

  describe('uuid', function () {
    it('gen', function (done) {
      benchmark('uuid gen', uuid, done);
    });

  });

});
