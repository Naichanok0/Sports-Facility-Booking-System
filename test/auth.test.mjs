import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

// Mount the router from src/routes.js but mock DB and auth behavior
import * as db from '../src/db.js';
import * as auth from '../src/auth.js';
import { router } from '../src/routes.js';

// Monkeypatch pool.request to return controlled results
function makeMockRequest(result) {
  return () => ({
    input: () => ({ query: async () => ({ recordset: result }) })
  });
}

// Setup app helper
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

test('auth register validation fails on short username', async () => {
  const app = makeApp();
  const res = await request(app)
    .post('/auth/register')
    .send({ username: 'ab', password: 'secret1', fullName: 'Test User' });
  assert.equal(res.status, 400);
  assert(res.body.errors, 'expected validation errors');
});

test('auth login returns error when user not found', async () => {
  // mock DB to return empty set
  db.pool.request = makeMockRequest([]);
  const app = makeApp();
  const res = await request(app)
    .post('/auth/login')
    .send({ username: 'nouser', password: 'x' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'User not found');
});
