import { URL, StandardURL, standardize } from './url';

describe('Unit: lib/url', () => {
  describe('URL', () => {
    const protocol = 'https:';
    const hostname = 'example.com';
    const dir = '/dir/';
    const file = 'index.html';
    const query = '?a=1&b=2';
    const fragment = '#?hash';

    const origin = protocol + '//' + hostname as `${typeof protocol}//${typeof hostname}`;
    assert(origin === 'https://example.com');

    it('relative', () => {
      // @ts-expect-error
      assert.throws(() => new URL(''));
      assert(new URL('', location.href).href === location.href);
      assert(new URL('', location.href).href === new globalThis.URL('', location.href).href);
      assert(new URL(' ', location.href).href === location.href);
      assert(new URL(' ', location.href).href === new globalThis.URL(' ', location.href).href);

      assert.throws(() => new URL('http:' as URL.Origin<string>));
      assert.throws(() => new globalThis.URL('http:'));
      assert(new URL('http:', location.href).href === new globalThis.URL('http:', location.href).href);
      assert.throws(() => new URL('http:/' as URL.Origin<string>));
      assert.throws(() => new globalThis.URL('http:/'));
      assert(new URL('http:/', location.href).href === new globalThis.URL('http:/', location.href).href);
      assert.throws(() => new URL('http://'));
      assert.throws(() => new globalThis.URL('http://'));
      assert.throws(() => new URL('http://', location.href));
      assert.throws(() => new globalThis.URL('http://', location.href));
    });

    it('origin', () => {
      assert(new URL(origin).origin === origin);
      assert(new URL(origin + ':80' as any).origin === origin + ':80');
      assert(new URL(origin + ':443' as any).origin === origin + '');
      assert(new URL('blob:').origin === new globalThis.URL('blob:').origin);
      assert(new URL('http://[::]').origin === new globalThis.URL('http://[::]').origin);
      assert(new URL('http://[::1]').origin === new globalThis.URL('http://[::1]').origin);
      assert(new URL('http://[::ffff:0:0]').origin === new globalThis.URL('http://[::ffff:0:0]').origin);
      assert(new URL('http://name:pass@domain').origin === new globalThis.URL('http://name:pass@domain').origin);
    });

    it('scheme', () => {
      assert(new URL(origin).scheme === protocol.split(':')[0]);
    });

    it('protocol', () => {
      assert(new URL(origin).protocol === protocol);
    });

    it('host', () => {
      assert(new URL(origin).host === hostname);
      assert(new URL(origin + ':80' as any).host === hostname + ':80');
      assert(new URL(origin + ':443' as any).host === hostname + '');
    });

    it('hostname', () => {
      assert(new URL(origin).hostname === hostname);
      assert(new URL(origin + ':80' as any).hostname === hostname);
      assert(new URL(origin + ':443' as any).hostname === hostname);
    });

    it('port', () => {
      assert(new URL(origin).port === '');
      assert(new URL(origin + ':80' as any).port === '80');
      assert(new URL(origin + ':443' as any).port === '');
    });

    it('href', () => {
      assert(new URL(origin + dir + file as any).href === origin + dir + file);
      assert(new URL(origin + dir + file + query + fragment as any).href === origin + dir + file + query + fragment);
    });

    it('resource', () => {
      assert(new URL(origin + dir + file + query + fragment as any).resource === origin + dir + file + query);
      assert(new URL(origin + '/' as any).resource === origin + '/');
      assert(new URL(origin + '/?' as any).resource === origin + '/');
      assert(new URL(origin + '/??' as any).resource === origin + '/??');
      assert(new URL(origin + '/?#' as any).resource === origin + '/');
      assert(new URL(origin + dir + file + '?' as any).resource === origin + dir + file);
      assert(new URL(origin + dir + file + '??' as any).resource === origin + dir + file + '??');
      assert(new URL(origin + dir + file + '?#' as any).resource === origin + dir + file);
      assert(new URL('file:///').resource === 'file:///');
    });

    it('path', () => {
      assert(new URL(origin).path === '/');
      assert(new URL(dir + file + query + fragment, location.href).path === dir + file + query);
      assert(new URL('/', location.href).path === '/');
    });

    it('pathname', () => {
      assert(new URL(origin).pathname === '/');
      assert(new URL(dir + file + query + fragment, location.href).pathname === dir + file);
      assert(new URL('/', location.href).pathname === '/');
    });

    it('query', () => {
      assert(new URL(dir + file + query + fragment, location.href).query === query);
      assert(new URL('', location.href).query === '');
      assert(new URL('?', location.href).query === '?');
      assert(new URL('??', location.href).query === '??');
      assert(new URL('?#', location.href).query === '?');
      assert(new URL('#?', location.href).query === '');
    });

    it('fragment', () => {
      assert(new URL(dir + file + query + fragment, location.href).fragment === fragment);
      assert(new URL('', location.href).fragment === '');
      assert(new URL('#', location.href).fragment === '#');
      assert(new URL('##', location.href).fragment === '##');
    });

    it('standard', () => {
      assert((): URL<StandardURL> => new URL(standardize('', location.href)));
      assert((): URL<StandardURL> => new URL(new URL(standardize('', location.href)).href));
      // @ts-expect-error
      assert.throws((): URL<StandardURL> => new URL(new URL(standardize('', location.href)).query));
      // @ts-expect-error
      assert((): URL<StandardURL> => new URL(new URL(standardize('', location.href)).query, location.href));
      assert((): URL<StandardURL> => new URL(new URL(standardize('', location.href)).query, standardize(location.href)));
    });

  });

});
