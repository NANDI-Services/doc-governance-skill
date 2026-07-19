#!/usr/bin/env node
// Ponytail: single runnable check for the parser + classifiers.
// No frameworks. Run: node bin/lib/diff-classify.self-test.js

const assert = require('assert');
const {
  parseUnifiedDiff,
  isWhitespaceOnly,
  isCommentOnly,
  buildSample,
} = require('./diff-classify');

let passed = 0;
let failed = 0;
function check(label, fn) {
  try {
    fn();
    console.log('  ok   ' + label);
    passed++;
  } catch (err) {
    console.log('  FAIL ' + label);
    console.log('       ' + err.message);
    failed++;
  }
}

console.log('parseUnifiedDiff');
check('splits +/- lines and ignores headers', () => {
  const text = [
    'diff --git a/f.js b/f.js',
    'index 111..222 100644',
    '--- a/f.js',
    '+++ b/f.js',
    '@@ -1,3 +1,3 @@',
    ' unchanged',
    '-old line',
    '+new line',
  ].join('\n');
  const { added, removed } = parseUnifiedDiff(text);
  assert.deepStrictEqual(added, ['new line']);
  assert.deepStrictEqual(removed, ['old line']);
});

console.log('isWhitespaceOnly');
check('true when only indentation differs', () => {
  const removed = ['  foo();', '    bar();'];
  const added = ['\tfoo();', '\t\tbar();'];
  assert.strictEqual(isWhitespaceOnly(added, removed), true);
});
check('false when a token differs', () => {
  const removed = ['foo();'];
  const added = ['bar();'];
  assert.strictEqual(isWhitespaceOnly(added, removed), false);
});
check('false on length mismatch', () => {
  assert.strictEqual(isWhitespaceOnly(['a'], []), false);
});

console.log('isCommentOnly');
check('true for // comment change in .prisma', () => {
  const removed = ['// old note about path/foo.js'];
  const added = ['// new note about path/bar.js'];
  assert.strictEqual(isCommentOnly('prisma/schema.prisma', added, removed), true);
});
check('true for # comment change in .py', () => {
  const removed = ['# old', ''];
  const added = ['# new'];
  assert.strictEqual(isCommentOnly('scripts/x.py', added, removed), true);
});
check('true for <!-- --> in .html', () => {
  const removed = ['<!-- old -->'];
  const added = ['<!-- new -->'];
  assert.strictEqual(isCommentOnly('page.html', added, removed), true);
});
check('false when a code line is mixed in', () => {
  const removed = ['// old'];
  const added = ['// new', 'const x = 1;'];
  assert.strictEqual(isCommentOnly('x.ts', added, removed), false);
});
check('false for unknown extension', () => {
  const removed = ['-- old'];
  const added = ['-- new'];
  assert.strictEqual(isCommentOnly('x.unknownext', added, removed), false);
});

console.log('buildSample');
check('emits up to 3 lines, - before + within a pair', () => {
  const sample = buildSample(['a1', 'a2'], ['r1', 'r2']);
  assert.strictEqual(sample.length <= 3, true);
  assert.strictEqual(sample[0], '- r1');
  assert.strictEqual(sample[1], '+ a1');
});

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
