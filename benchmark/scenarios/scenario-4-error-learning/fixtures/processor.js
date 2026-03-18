/**
 * Data processor that transforms items through an async pipeline.
 * There's a subtle bug causing intermittent data loss.
 */

async function processItem(item) {
  const delay = Math.random() * 50;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return {
    id: item.id,
    name: item.name.toUpperCase(),
    processed: true,
    timestamp: Date.now(),
  };
}

async function processAll(items) {
  const results = [];
  const errors = [];

  // Process all items concurrently
  await Promise.all(items.map(async (item) => {
    try {
      const processed = await processItem(item);
      results.push(processed);
    } catch (err) {
      errors.push({ item: item.id, error: err.message });
    }
  }));

  return {
    results,
    errors,
    summary: {
      total: items.length,
      processed: results.length,
      failed: errors.length,
    },
  };
}

async function processInBatches(items, batchSize = 5) {
  const allResults = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = [];

    await Promise.all(batch.map(async (item) => {
      const result = await processItem(item);
      batchResults.push(result);
    }));

    allResults.push(...batchResults);
  }

  return allResults;
}

module.exports = { processItem, processAll, processInBatches };
