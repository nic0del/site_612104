import test from "node:test";
import assert from "node:assert/strict";
import { createSaveQueue } from "../js/saveQueue.js";

test("serialized writes coalesce pending progress and cannot overwrite in reverse order", async () => {
  const writes = [], releases = [];
  const queue = createSaveQueue(job => {
    writes.push(job);
    return new Promise(resolve => releases.push(resolve));
  }, () => {}, 100000);
  queue.enqueue({ scene: 1 });
  const flush = queue.flush();
  queue.enqueue({ scene: 2 });
  queue.enqueue({ scene: 3 });
  assert.deepEqual(writes, [{ scene: 1 }]);
  releases.shift()();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(writes, [{ scene: 1 }, { scene: 3 }]);
  releases.shift()();
  await flush;
  await queue.reset();
});

test("failed cloud writes report an error; later checkpoints retry", async () => {
  let fail = true;
  const statuses = [];
  const queue = createSaveQueue(async () => { if (fail) throw new Error("offline"); },
    status => statuses.push(status), 100000);
  queue.enqueue({ scene: 1 });
  await queue.flush();
  assert.equal(statuses.at(-1), "error");
  fail = false;
  queue.enqueue({ scene: 2 });
  await queue.flush();
  assert.equal(statuses.at(-1), "saved");
  await queue.reset();
});

test("session change drops pending writes and waits for a previous write", async () => {
  const writes = [];
  const queue = createSaveQueue(async job => writes.push(job), () => {}, 100000);
  queue.enqueue({ owner: "alice" });
  await queue.reset();
  queue.enqueue({ owner: "bob" });
  await queue.flush();
  assert.deepEqual(writes, [{ owner: "bob" }]);
  await queue.reset();
});
