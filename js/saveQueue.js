// Serialize cloud writes so an older request can never overwrite a newer one.
export function createSaveQueue(write, onStatus = () => {}, delay = 600) {
  let pending = null;
  let timer = null;
  let running = null;
  let generation = 0;

  async function drain() {
    clearTimeout(timer);
    timer = null;
    if (running) {
      await running;
      return pending ? drain() : undefined;
    }
    if (!pending) return;
    const job = pending;
    pending = null;
    const myGeneration = generation;
    running = (async () => {
      try {
        await write(job);
        if (myGeneration === generation && !pending) onStatus("saved");
      } catch (error) {
        if (myGeneration === generation) onStatus("error", error);
      }
    })();
    await running;
    running = null;
    if (pending) return drain();
  }
  return {
    enqueue(job) {
      pending = JSON.parse(JSON.stringify(job));
      onStatus("saving");
      clearTimeout(timer);
      timer = setTimeout(() => { void drain(); }, delay);
    },
    flush: drain,
    async reset() {
      generation++;
      clearTimeout(timer);
      timer = null;
      pending = null;
      // Finish the previous account's request before loading another session.
      if (running) await running;
    }
  };
}
