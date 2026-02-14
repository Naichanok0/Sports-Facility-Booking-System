import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

import * as db from '../src/db.js';
import * as auth from '../src/auth.js';
import { router } from '../src/routes.js';

// helper to mock pool.request
function makeMockRequest(result) {
  return () => ({
    input: () => ({
      query: async () => ({ recordset: result })
    })
  });
}

function makeAppWithAuth() {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

test('POST /queues validation rejects missing fields', async () => {
  const app = makeAppWithAuth();
  const token = auth.signToken({ userId: 1, role: 'citizen' });
  const res = await request(app)
    .post('/queues')
    .set('Authorization', `Bearer ${token}`)
    .send({ centerId: 1 });
  assert.equal(res.status, 400);
  assert(res.body.errors, 'expected validation errors');
});

test('POST /queues success path (mocked DB)', async () => {
  // mock DB to return newly inserted QueueID
  db.pool.request = () => ({
    input(..._args) { return this; },
    query: async () => ({ recordset: [{ QueueID: 123 }] })
  });

  const app = makeAppWithAuth();
  const token = auth.signToken({ userId: 1, role: 'citizen' });
  const res = await request(app)
    .post('/queues')
    .set('Authorization', `Bearer ${token}`)
    .send({ centerId: 1, serviceId: 1, bookingDate: '2025-11-21', slotTime: '09:00' });

  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.queueId, 123);
});
