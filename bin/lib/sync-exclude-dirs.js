#!/usr/bin/env node
// Generates the exclusion-dirs sentence in SKILL.md from EXCLUDE_DIRS so the
// two cannot drift. They did: 0.7.0 added .agents/, .claude/ and graphify-out/
// to the code and nobody touched the prose for two weeks. The list lives in
// prose, not as path-refs, so the skill itself provably cannot flag it —
// see SKILL.md "## Known Limitations".
//
//   node bin/lib/sync-exclude-dirs.js --check   (exit 1 on drift; used by CI)
//   node bin/lib/sync-exclude-dirs.js --fix
//   node bin/lib/sync-exclude-dirs.js --check <file>   (self-test: negative case)

const fs = require('fs');
const path = require('path');
const { EXCLUDE_DIRS } = require('./scan');

const START = '<!-- exclude-dirs:start -->';
const END = '<!-- exclude-dirs:end -->';
const DEFAULT_TARGET = path.join(__dirname, '..', '..', 'SKILL.md');

function expectedLine() {
  const dirs = [...EXCLUDE_DIRS].map(d => '`' + d + '`').join(', ');
  return '- Scans every `*.md` in the repo (skipping ' + dirs +
    '), plus anything matched by `.doc-governance/ignore`.';
}

// CRLF-normalized. A content check whose result depends on the OS is not a
// check: it would go green on the runner and red on a Windows worktree.
function normalize(s) {
  return s.replace(/\r\n/g, '\n');
}

function locate(raw) {
  const startIdx = raw.indexOf(START);
  const endIdx = raw.indexOf(END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error('markers ' + START + ' / ' + END + ' not found in SKILL.md');
  }
  return { startIdx, endIdx, bodyStart: startIdx + START.length, body: raw.slice(startIdx + START.length, endIdx) };
}

function main() {
  const argv = process.argv.slice(2);
  const mode = argv.includes('--fix') ? 'fix' : 'check';
  const target = argv.find(a => !a.startsWith('--')) || DEFAULT_TARGET;
  const raw = fs.readFileSync(target, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const { bodyStart, endIdx, body } = locate(raw);
  const want = eol + expectedLine() + eol;

  if (normalize(body) === normalize(want)) {
    console.log('exclude-dirs: in sync with EXCLUDE_DIRS (' + EXCLUDE_DIRS.size + ' dirs)');
    return 0;
  }
  if (mode === 'fix') {
    fs.writeFileSync(target, raw.slice(0, bodyStart) + want + raw.slice(endIdx));
    console.log('exclude-dirs: regenerated from EXCLUDE_DIRS (' + EXCLUDE_DIRS.size + ' dirs)');
    return 0;
  }
  console.error('exclude-dirs: out of sync with bin/lib/scan.js EXCLUDE_DIRS');
  console.error('  expected: ' + expectedLine());
  console.error('  found:    ' + normalize(body).trim());
  console.error('  fix with: node bin/lib/sync-exclude-dirs.js --fix');
  return 1;
}

try {
  process.exit(main());
} catch (err) {
  console.error('[doc-governance-sync-exclude-dirs] ' + err.message);
  process.exit(1);
}
