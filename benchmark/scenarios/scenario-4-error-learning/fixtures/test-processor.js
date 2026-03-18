/**
 * Test that demonstrates the bug — run this to see inconsistent results.
 */

const { processAll } = require('./processor');

async function test() {
  const items = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `item-${i + 1}`,
  }));

  // Run multiple times to expose race condition
  for (let trial = 0; trial < 5; trial++) {
    const { results, summary } = await processAll(items);
    const uniqueIds = new Set(results.map((r) => r.id));

    console.log(`Trial ${trial + 1}: ${summary.processed}/${summary.total} processed, ` +
      `${uniqueIds.size} unique IDs`);

    if (uniqueIds.size !== items.length) {
      console.log('  BUG: Missing or duplicate items detected!');
    }
  }
}

test().catch(console.error);
