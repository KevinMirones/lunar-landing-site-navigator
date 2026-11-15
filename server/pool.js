// A small pool of worker threads. Tasks carry a job id so everything still
// queued for a job can be dropped when its client goes away.
import { Worker } from 'node:worker_threads';

export function createPool(url, size, workerData) {
  const idle = [];
  const queue = [];
  const workers = new Set();

  function spawn() {
    const worker = new Worker(url, { workerData });
    worker.task = null;
    worker.on('message', (result) => {
      const task = worker.task;
      worker.task = null;
      idle.push(worker);
      task?.resolve(result);
      pump();
    });
    worker.on('error', (err) => {
      // A crashed worker fails its task and is replaced, so the pool keeps its size.
      workers.delete(worker);
      worker.task?.reject(err);
      spawn();
      pump();
    });
    workers.add(worker);
    idle.push(worker);
  }

  function pump() {
    while (idle.length && queue.length) {
      const worker = idle.pop();
      worker.task = queue.shift();
      worker.postMessage(worker.task.message);
    }
  }

  for (let i = 0; i < size; i++) spawn();

  return {
    size,
    run(message, jobId) {
      return new Promise((resolve, reject) => {
        queue.push({ message, jobId, resolve, reject });
        pump();
      });
    },
    /** Tasks of this job that have not started resolve with null. Running ones finish. */
    cancel(jobId) {
      for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].jobId === jobId) queue.splice(i, 1)[0].resolve(null);
      }
    },
    async close() {
      await Promise.all([...workers].map((w) => w.terminate()));
      workers.clear();
    },
  };
}
