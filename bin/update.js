#!/usr/bin/env node
// ponytail: reports only, no auto-fix. Add --apply mode if humans stop editing docs.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findRepoRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  } catch {
    return process.cwd();
  }
}

function parseArgs(argv) {
  const args = { since: null, files: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--since') { args.since = argv[++i]; continue; }
    if (a === '--files') { args.files = argv[++i].split(',').filter(Boolean); continue; }
    if (a.startsWith('--since=')) { args.since = a.slice(8); continue; }
    if (a.startsWith('--files=')) { args.files = a.slice(8).split(',').filter(Boolean); continue; }
  }
  return args;
}

function parseMap(text) {
  const map = { sealedSha: null, sealedAt: null, docs: [] };
  const lines = text.split(/\r?\n/);
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if ((m = /^sealed_sha:\s*(.+)$/.exec(line))) map.sealedSha = m[1].trim();
    else if ((m = /^sealed_at:\s*(.+)$/.exec(line))) map.sealedAt = m[1].trim();
    else if (/^## Inventory\s*$/.test(line)) { i++; break; }
  }
  let current = null;
  let section = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if ((m = /^### (.+)$/.exec(line))) {
      if (current) map.docs.push(current);
      current = { path: m[1].trim(), title: null, headings: [], codeRefs: [] };
      section = null;
    } else if (!current) {
      continue;
    } else if ((m = /^title:\s*(.*)$/.exec(line))) {
      current.title = m[1].trim();
      section = null;
    } else if (/^headings:\s*(\[\])?\s*$/.test(line)) {
      section = 'headings';
    } else if (/^code_refs:\s*(\[\])?\s*$/.test(line)) {
      section = 'code_refs';
    } else if ((m = /^  - (?:H\d+:\s*)?(.+)$/.exec(line))) {
      if (section === 'code_refs') current.codeRefs.push(m[1].trim());
    }
  }
  if (current) map.docs.push(current);
  return map;
}

// ponytail: git refs like "HEAD~5" or SHAs are safe; block anything with shell metacharacters.
function isSafeGitRef(ref) {
  return typeof ref === 'string' && /^[a-zA-Z0-9._/~^@\-]{1,80}$/.test(ref);
}

function readStdinSync() {
  try {
    if (process.stdin.isTTY) return null;
    const data = fs.readFileSync(0, 'utf8');
    const lines = data.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    return lines.length ? lines : null;
  } catch {
    return null;
  }
}

function getChangedFiles({ args, sealedSha, root }) {
  if (args.files) return args.files;
  const stdinFiles = readStdinSync();
  if (stdinFiles) return stdinFiles;
  const baseRef = args.since || sealedSha || 'HEAD';
  if (!isSafeGitRef(baseRef)) {
    throw new Error(`unsafe git ref: ${baseRef}`);
  }
  // `git diff <ref>` covers both committed and uncommitted changes between ref and working tree.
  try {
    const out = execFileSync('git', ['diff', '--name-only', baseRef], { cwd: root, encoding: 'utf8' });
    return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function pathsMatch(codeRef, changed) {
  if (codeRef === changed) return true;
  const refAsDir = codeRef.endsWith('/') ? codeRef : codeRef + '/';
  if (changed.startsWith(refAsDir)) return true;
  const changedAsDir = changed.endsWith('/') ? changed : changed + '/';
  if (codeRef.startsWith(changedAsDir)) return true;
  return false;
}

function classifyChanged(changedFiles) {
  const code = [];
  const md = [];
  for (const f of changedFiles) {
    if (f.startsWith('.doc-governance/')) continue;
    if (/\.md$/i.test(f)) md.push(f);
    else code.push(f);
  }
  return { code, md };
}

function renderReport({ map, args, changedFiles, mdChanged, affected }) {
  const range = args.files
    ? '(--files)'
    : args.since
    ? `${args.since}..worktree`
    : (map.sealedSha ? `${map.sealedSha}..worktree` : '(no-baseline)');

  const critical = 0;
  const warnings = affected.length;
  const info = mdChanged.length > 0 ? 1 : 0;

  const lines = [];
  lines.push('DOC_GOVERNANCE_UPDATE:');
  lines.push('');
  lines.push(`sealed_sha: ${map.sealedSha || '(none)'}`);
  lines.push(`diff_range: ${range}`);
  lines.push(`files_changed: ${changedFiles.length}`);
  lines.push(`docs_affected: ${affected.length}`);
  lines.push('');
  lines.push(`CRITICAL (${critical}):`);
  lines.push('');
  lines.push(`WARNING (${warnings}):`);
  for (const a of affected) {
    lines.push(`  - doc: ${a.doc}`);
    lines.push(`    referenced_code_changed: [${a.refs.join(', ')}]`);
    lines.push(`    reason: doc references code that changed since baseline`);
    lines.push(`    suggested_action: review sections in ${a.doc} that mention changed paths`);
  }
  lines.push('');
  lines.push(`INFO (${info}):`);
  if (info) {
    lines.push(`  - map_staleness: ${mdChanged.length} .md file(s) changed since sealed_sha, map may not reflect current structure`);
    lines.push(`    suggested_action: run audit to re-seal`);
  }
  lines.push('');
  lines.push(`SUMMARY: ${critical} critical, ${warnings} warnings, ${info} info`);
  return lines.join('\n');
}

function main() {
  const root = findRepoRoot();
  const mapPath = path.join(root, '.doc-governance', 'map.md');
  if (!fs.existsSync(mapPath)) {
    console.error('[doc-governance-update] map not found at .doc-governance/map.md. Run audit first.');
    process.exit(1);
  }
  const args = parseArgs(process.argv.slice(2));
  const map = parseMap(fs.readFileSync(mapPath, 'utf8'));
  const changedFiles = getChangedFiles({ args, sealedSha: map.sealedSha, root });
  const { code: codeChanged, md: mdChanged } = classifyChanged(changedFiles);

  const affected = [];
  for (const doc of map.docs) {
    if (!doc.codeRefs.length) continue;
    const matches = doc.codeRefs.filter(ref => codeChanged.some(c => pathsMatch(ref, c)));
    if (matches.length) affected.push({ doc: doc.path, refs: matches });
  }

  const report = renderReport({ map, args, changedFiles, mdChanged, affected });
  console.log(report);

  process.exit(affected.length > 0 ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error(`[doc-governance-update] ${err.message}`);
  process.exit(1);
}
