#!/usr/bin/env node
// ponytail: reports only, no auto-fix. Add --apply mode if humans stop editing docs.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { scanRepo, renderMap } = require('./lib/scan');
const { classifyFileDiff } = require('./lib/diff-classify');

const BOOTSTRAP_TOOL_VERSION = 'update-bootstrap';

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

// Returns [{ status, path, oldPath? }]. status: M | A | D | R | C | T.
function getChangedEntries({ args, sealedSha, root }) {
  if (args.files) {
    return args.files.map(p => ({ status: 'M', path: p }));
  }
  const stdinFiles = readStdinSync();
  if (stdinFiles) {
    return stdinFiles.map(p => ({ status: 'M', path: p }));
  }
  const baseRef = args.since || sealedSha || 'HEAD';
  if (!isSafeGitRef(baseRef)) {
    throw new Error('unsafe git ref: ' + baseRef);
  }
  let out;
  try {
    out = execFileSync(
      'git',
      ['diff', '--name-status', '--find-renames', baseRef],
      { cwd: root, encoding: 'utf8' }
    );
  } catch {
    return [];
  }
  const entries = [];
  for (const raw of out.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const parts = raw.split('\t');
    const rawStatus = parts[0] || '';
    const statusLetter = rawStatus[0];
    if (statusLetter === 'R' || statusLetter === 'C') {
      if (parts.length >= 3) {
        entries.push({ status: statusLetter, oldPath: parts[1], path: parts[2] });
      }
    } else if (parts.length >= 2) {
      entries.push({ status: statusLetter, path: parts[1] });
    }
  }
  return entries;
}

function pathsMatch(codeRef, changed) {
  if (codeRef === changed) return true;
  const refAsDir = codeRef.endsWith('/') ? codeRef : codeRef + '/';
  if (changed.startsWith(refAsDir)) return true;
  const changedAsDir = changed.endsWith('/') ? changed : changed + '/';
  if (codeRef.startsWith(changedAsDir)) return true;
  return false;
}

function classifyEntries(entries) {
  const codeChanged = [];
  const mdChanged = [];
  const renames = [];
  for (const e of entries) {
    if (e.path.startsWith('.doc-governance/')) continue;
    if (e.status === 'R' || e.status === 'C') {
      renames.push({ oldPath: e.oldPath, newPath: e.path });
      continue;
    }
    if (/\.md$/i.test(e.path)) {
      mdChanged.push(e.path);
      continue;
    }
    codeChanged.push({ path: e.path, status: e.status });
  }
  return { codeChanged, mdChanged, renames };
}

function buildChangesByFile({ codeChanged, mapDocs, root, sealedSha, mdChangedSet }) {
  const changes = [];
  for (const c of codeChanged) {
    const unsyncedDocs = [];
    const alreadyTouchedDocs = [];
    for (const doc of mapDocs) {
      if (!doc.codeRefs.length) continue;
      if (doc.codeRefs.some(ref => pathsMatch(ref, c.path))) {
        if (mdChangedSet && mdChangedSet.has(doc.path)) alreadyTouchedDocs.push(doc.path);
        else unsyncedDocs.push(doc.path);
      }
    }
    if (unsyncedDocs.length === 0 && alreadyTouchedDocs.length === 0) continue;
    let cls;
    if (c.status === 'A' || c.status === 'D' || !sealedSha) {
      cls = { kind: 'substantive', sample: [] };
    } else {
      cls = classifyFileDiff({ root, sha: sealedSha, filePath: c.path });
    }
    changes.push({
      path: c.path,
      status: c.status,
      kind: cls.kind,
      sample: cls.sample,
      unsyncedDocs,
      alreadyTouchedDocs,
    });
  }
  return changes;
}

function classifyRenamesAgainstDocs(renames, mapDocs) {
  return renames.map(r => {
    const affectedDocs = [];
    for (const doc of mapDocs) {
      if (!doc.codeRefs.length) continue;
      if (doc.codeRefs.some(ref => pathsMatch(ref, r.oldPath))) {
        affectedDocs.push(doc.path);
      }
    }
    return { oldPath: r.oldPath, newPath: r.newPath, affectedDocs };
  });
}

function renderReport(opts) {
  const { map, args, entries, changesByFile, mdChanged, renamesReport, autoBootstrapped } = opts;
  const range = args.files
    ? '(--files)'
    : args.since
    ? args.since + '..worktree'
    : (map.sealedSha ? map.sealedSha + '..worktree' : '(no-baseline)');

  // ponytail: substantive with unsyncedDocs=0 means every affected doc was
  // edited in the same diff-range — downgrade to INFO instead of firing a FP.
  const warnings = changesByFile.filter(c => c.kind === 'substantive' && c.unsyncedDocs.length > 0);
  const alreadySynced = changesByFile.filter(c => c.kind === 'substantive' && c.unsyncedDocs.length === 0 && c.alreadyTouchedDocs.length > 0);
  const trivials = changesByFile.filter(c => c.kind !== 'substantive');
  const criticalCount = 0;
  const warningCount = warnings.length;
  const infoCount =
    trivials.length +
    alreadySynced.length +
    renamesReport.length +
    (mdChanged.length > 0 ? 1 : 0) +
    (autoBootstrapped ? 1 : 0);

  const docsAffected = new Set();
  for (const c of changesByFile) {
    for (const d of c.unsyncedDocs) docsAffected.add(d);
    for (const d of c.alreadyTouchedDocs) docsAffected.add(d);
  }

  const lines = [];
  lines.push('DOC_GOVERNANCE_UPDATE:');
  lines.push('');
  lines.push('sealed_sha: ' + (map.sealedSha || '(none)'));
  lines.push('diff_range: ' + range);
  lines.push('files_changed: ' + entries.length);
  lines.push('docs_affected: ' + docsAffected.size);
  lines.push('');

  lines.push('CRITICAL (' + criticalCount + '):');
  lines.push('');

  lines.push('WARNING (' + warningCount + '):');
  for (const c of warnings) {
    lines.push('  - code_file: ' + c.path + ' (kind: substantive)');
    lines.push('    affected_docs: [' + c.unsyncedDocs.join(', ') + ']');
    if (c.alreadyTouchedDocs.length) {
      lines.push('    also_touched_in_range: [' + c.alreadyTouchedDocs.join(', ') + ']');
    }
    if (c.sample.length) {
      lines.push('    diff_sample:');
      for (const s of c.sample) lines.push('      ' + s);
    }
    lines.push('    reason: doc references code that changed since baseline');
    lines.push('    suggested_action: review sections in affected_docs that mention ' + c.path);
  }

  lines.push('');
  lines.push('INFO (' + infoCount + '):');
  if (autoBootstrapped) {
    lines.push('  - baseline_auto_sealed: first run, sealed to ' + (map.sealedSha || '(no-git)'));
    lines.push('    suggested_action: commit .doc-governance/map.md to persist the baseline');
  }
  for (const c of alreadySynced) {
    lines.push('  - already_synced_in_diff_range: ' + c.path);
    lines.push('    affected_docs: [' + c.alreadyTouchedDocs.join(', ') + ']');
    lines.push('    reason: every doc referencing this path was edited in the same diff-range');
    lines.push('    suggested_action: none; docs already updated');
  }
  for (const c of trivials) {
    lines.push('  - trivial_change: ' + c.path + ' (kind: ' + c.kind + ')');
    const total = c.unsyncedDocs.length + c.alreadyTouchedDocs.length;
    lines.push('    affected_docs_count: ' + total + ' (suppressed; kind implies no action needed)');
    const kindLabel = c.kind === 'whitespace-only' ? 'whitespace' : 'comment';
    lines.push('    reason: only ' + kindLabel + ' lines changed; docs referencing this path are unlikely to be impacted');
    lines.push('    suggested_action: none unless the ' + kindLabel + ' carried semantic guidance');
  }
  for (const r of renamesReport) {
    lines.push('  - renamed: ' + r.oldPath + ' -> ' + r.newPath);
    if (r.affectedDocs.length) {
      lines.push('    affects: [' + r.affectedDocs.join(', ') + ']');
      lines.push('    suggested_action: update references in affected docs; consider re-audit to refresh baseline path');
    } else {
      lines.push('    affects: []');
      lines.push('    suggested_action: none; no mapped doc references the old path');
    }
  }
  if (mdChanged.length > 0) {
    lines.push('  - map_staleness: ' + mdChanged.length + ' .md file(s) changed since sealed_sha, map may not reflect current structure');
    lines.push('    suggested_action: run audit to re-seal');
  }

  lines.push('');
  lines.push('SUMMARY: ' + criticalCount + ' critical, ' + warningCount + ' warnings, ' + infoCount + ' info');
  return { text: lines.join('\n'), warningCount };
}

function bootstrapMap(root, mapPath) {
  const docs = scanRepo(root);
  let sealedSha = null;
  try {
    sealedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    sealedSha = null;
  }
  const content = renderMap({
    sealedSha,
    sealedAt: new Date().toISOString(),
    docs,
    toolVersion: BOOTSTRAP_TOOL_VERSION,
  });
  fs.mkdirSync(path.dirname(mapPath), { recursive: true });
  fs.writeFileSync(mapPath, content);
}

function main() {
  const root = findRepoRoot();
  const mapPath = path.join(root, '.doc-governance', 'map.md');
  let autoBootstrapped = false;
  if (!fs.existsSync(mapPath)) {
    bootstrapMap(root, mapPath);
    autoBootstrapped = true;
  }
  const args = parseArgs(process.argv.slice(2));
  const map = parseMap(fs.readFileSync(mapPath, 'utf8'));

  const entries = getChangedEntries({ args, sealedSha: map.sealedSha, root });
  const { codeChanged, mdChanged, renames } = classifyEntries(entries);
  const mdChangedSet = new Set(mdChanged);

  const changesByFile = buildChangesByFile({
    codeChanged,
    mapDocs: map.docs,
    root,
    sealedSha: map.sealedSha,
    mdChangedSet,
  });
  const renamesReport = classifyRenamesAgainstDocs(renames, map.docs);

  const rendered = renderReport({
    map, args, entries, changesByFile, mdChanged, renamesReport, autoBootstrapped,
  });
  console.log(rendered.text);

  process.exit(rendered.warningCount > 0 ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error('[doc-governance-update] ' + err.message);
  process.exit(1);
}
