const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('sidebar navigation uses Next links without cancelling normal navigation', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'components', 'nav-link.tsx'), 'utf8');
  assert.match(source, /import Link from 'next\/link'/);
  assert.match(source, /<Link href=\{href\} prefetch onClick=\{handleClick\}/);
  assert.doesNotMatch(source, /router\.push\(href\)/);
  assert.match(source, /e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey \|\| e\.altKey/);
});
