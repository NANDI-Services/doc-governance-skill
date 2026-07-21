#!/usr/bin/env node
// ponytail: zero-framework smoke for the already_synced_in_diff_range
// downgrade (see CHANGELOG 0.7.0). Spins a tmpdir, plants a doc<->code
// pair, dirties BOTH in the working tree, asserts the report degrades
// to INFO with zero warnings.

const os = require('os');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function demo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-gov-selftest-'));
  const binDir = path.join(__dirname, '..');
  const auditScript = path.join(binDir, 'audit.js');
  const updateScript = path.join(binDir, 'update.js');

  try {
    run('git', ['init', '--quiet'], tmp);
    run('git', ['config', 'user.email', 'test@example.com'], tmp);
    run('git', ['config', 'user.name', 'Test'], tmp);
    run('git', ['config', 'commit.gpgsign', 'false'], tmp);

    fs.mkdirSync(path.join(tmp, 'code'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'code', 'foo.js'), 'module.exports = 1;\n');
    fs.writeFileSync(path.join(tmp, 'X.md'), '# X\n\nRefers to `code/foo.js`.\n');

    run('git', ['add', '.'], tmp);
    run('git', ['commit', '-m', 'baseline', '--quiet'], tmp);

    run('node', [auditScript], tmp);

    // Dirty BOTH: same diff-range covers the code AND the doc.
    fs.writeFileSync(path.join(tmp, 'code', 'foo.js'), 'module.exports = 2;\n');
    fs.writeFileSync(path.join(tmp, 'X.md'), '# X\n\nRefers to `code/foo.js`. Updated too.\n');

    const out = run('node', [updateScript], tmp);

    assert(
      out.includes('already_synced_in_diff_range: code/foo.js'),
      'expected already_synced_in_diff_range INFO entry for code/foo.js\n---\n' + out
    );
    assert(
      out.includes('affected_docs: [X.md]'),
      'expected affected_docs [X.md] under the INFO entry\n---\n' + out
    );
    assert(
      out.includes('SUMMARY: 0 critical, 0 warnings'),
      'expected 0 warnings (all docs synced in same diff-range)\n---\n' + out
    );
    assert(
      !/WARNING \([1-9]/.test(out),
      'expected zero WARNING entries\n---\n' + out
    );

    console.log('ok  already_synced_in_diff_range downgrade — 0 warnings, 1 INFO');
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

demo();
