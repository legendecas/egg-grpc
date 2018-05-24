'use strict';

const mm = require('egg-mock');
const path = require('path');
const assert = require('assert');
const { fork } = require('child_process');

describe('test/custom.test.js', () => {
  let server;
  let app;
  let ctx;
  let client;
  before(function* () {
    server = fork(path.join(__dirname, 'fixtures/apps/custom/grpc_server'));
    yield new Promise(resolve => server.once('message', resolve));
    app = mm.app({ baseDir: 'apps/custom' });
    yield app.ready();
    ctx = app.mockContext();
    client = ctx.grpc.example.test;
  });

  after(() => client.close());
  after(() => app.close());
  after(done => {
    server.once('exit', done);
    server.kill();
  });
  afterEach(mm.restore);

  it('should echo with request-id', function* () {
    const result = yield client.echo({ id: 1, userName: 'grpc' });
    assert(result.id === 1);
    assert(result.msg === 'from server');
    assert(result.originMeta['request-id'].startsWith('custom_caller_'));
  });
});
