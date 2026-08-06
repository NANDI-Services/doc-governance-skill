// Shared by audit.js (seal side) and update.js (check side) so both ends hash
// worktree bytes the exact same way. `git hash-object` does NOT apply clean
// filters, so on Windows with core.autocrlf=true these hashes will not equal
// the committed blob — irrelevant here, because we only ever compare a
// hash-object result against another hash-object result.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DELETED = 'deleted';

// stderr ignored: under core.autocrlf git prints a "LF will be replaced by
// CRLF" line per file, which would bury the report in noise on Windows.
function git(root, args, opts = {}) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
    ...opts,
  });
}

function lines(out) {
  return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

// Returns Map<relPath, hash>. Paths that do not exist on disk are skipped —
// git hash-object --stdin-paths aborts the whole batch on the first missing
// file, so filtering up front keeps one bad path from voiding every hash.
function hashPaths(root, paths) {
  const result = new Map();
  const existing = paths.filter(p => {
    try { return fs.statSync(path.join(root, p)).isFile(); } catch { return false; }
  });
  if (!existing.length) return result;
  let out;
  try {
    out = git(root, ['hash-object', '--stdin-paths'], { input: existing.join('\n') + '\n' });
  } catch {
    return result;
  }
  const hashes = lines(out);
  if (hashes.length !== existing.length) return result;
  for (let i = 0; i < existing.length; i++) result.set(existing[i], hashes[i]);
  return result;
}

function isSkipped(p) {
  return p.startsWith('.doc-governance/');
}

// Every path whose worktree content differs from HEAD at seal time: tracked
// modifications, staged changes, untracked files, and deletions. These are the
// paths the map's inventory already reflects but sealed_sha does not — without
// recording them, committing them later reads as fresh drift.
function collectDirty(root) {
  let modified, deleted, untracked;
  try {
    modified = lines(git(root, ['diff', '--name-only', '--diff-filter=d', 'HEAD']));
    deleted = lines(git(root, ['diff', '--name-only', '--diff-filter=D', 'HEAD']));
    untracked = lines(git(root, ['ls-files', '--others', '--exclude-standard']));
  } catch {
    return [];
  }
  const present = [...new Set([...modified, ...untracked])].filter(p => !isSkipped(p));
  const hashes = hashPaths(root, present);
  const entries = [];
  for (const p of present) {
    const h = hashes.get(p);
    if (h) entries.push({ hash: h, path: p });
  }
  for (const p of deleted) {
    if (isSkipped(p)) continue;
    entries.push({ hash: DELETED, path: p });
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return entries;
}

module.exports = { DELETED, collectDirty, hashPaths };
