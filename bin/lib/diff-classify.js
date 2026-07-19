// Ponytail: conservative classifier. Only pure classifications trigger
// downgrade. One substantive line taints the whole file. False negatives
// (missing a real substantive change) are worse than false positives
// (leaving a trivial change as WARNING).

const { execFileSync } = require('child_process');
const path = require('path');

const CFAMILY = [/^\s*\/\//, /^\s*\*(?!\/)/, /^\s*\/\*/, /^\s*\*\//];
const HASH = [/^\s*#/];
const MARKUP = [/^\s*<!--/, /^\s*-->/];
const DASH = [/^\s*--/];
const CSS = [/^\s*\/\*/, /^\s*\*(?!\/)/, /^\s*\*\//];

// ponytail: extend when the next language shows up in a real repo.
// Unknown extension falls through to 'substantive' (safe default).
const COMMENT_PATTERNS_BY_EXT = {
  '.js': CFAMILY, '.ts': CFAMILY, '.jsx': CFAMILY, '.tsx': CFAMILY,
  '.mjs': CFAMILY, '.cjs': CFAMILY, '.c': CFAMILY, '.cc': CFAMILY,
  '.cpp': CFAMILY, '.h': CFAMILY, '.hpp': CFAMILY, '.java': CFAMILY,
  '.cs': CFAMILY, '.go': CFAMILY, '.rs': CFAMILY, '.swift': CFAMILY,
  '.kt': CFAMILY, '.kts': CFAMILY, '.scala': CFAMILY, '.prisma': CFAMILY,
  '.proto': CFAMILY, '.php': CFAMILY,
  '.py': HASH, '.rb': HASH, '.sh': HASH, '.bash': HASH, '.zsh': HASH,
  '.fish': HASH, '.pl': HASH, '.yml': HASH, '.yaml': HASH, '.toml': HASH,
  '.conf': HASH, '.env': HASH, '.cfg': HASH, '.ini': HASH, '.r': HASH,
  '.jl': HASH,
  '.html': MARKUP, '.htm': MARKUP, '.xml': MARKUP, '.svg': MARKUP,
  '.vue': MARKUP,
  '.sql': DASH, '.lua': DASH, '.hs': DASH, '.elm': DASH, '.ex': DASH,
  '.exs': DASH,
  '.css': CSS, '.scss': CSS, '.sass': CSS, '.less': CSS,
};

function isSafeGitRef(ref) {
  return typeof ref === 'string' && /^[a-zA-Z0-9._/~^@\-]{1,80}$/.test(ref);
}

function parseUnifiedDiff(text) {
  const added = [];
  const removed = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw) continue;
    if (raw.startsWith('+++') || raw.startsWith('---')) continue;
    if (raw.startsWith('@@') || raw.startsWith('diff --git') || raw.startsWith('index ')) continue;
    if (raw.startsWith('new file mode') || raw.startsWith('deleted file mode')) continue;
    if (raw.startsWith('similarity index') || raw.startsWith('rename ') || raw.startsWith('Binary files')) continue;
    if (raw.startsWith('+')) added.push(raw.slice(1));
    else if (raw.startsWith('-')) removed.push(raw.slice(1));
  }
  return { added, removed };
}

function normalizeWs(line) {
  return line.trim().replace(/\s+/g, ' ');
}

function isWhitespaceOnly(added, removed) {
  if (added.length !== removed.length) return false;
  const a = added.map(normalizeWs).sort();
  const r = removed.map(normalizeWs).sort();
  for (let i = 0; i < a.length; i++) if (a[i] !== r[i]) return false;
  return true;
}

function isCommentOnly(filePath, added, removed) {
  const ext = path.extname(filePath).toLowerCase();
  const patterns = COMMENT_PATTERNS_BY_EXT[ext];
  if (!patterns) return false;
  const matches = (line) => {
    const stripped = line.trim();
    if (stripped === '') return true;
    return patterns.some((re) => re.test(line));
  };
  for (const line of added) if (!matches(line)) return false;
  for (const line of removed) if (!matches(line)) return false;
  return true;
}

function buildSample(added, removed, limit = 3) {
  const out = [];
  const max = Math.max(added.length, removed.length);
  for (let i = 0; i < max && out.length < limit; i++) {
    if (i < removed.length) out.push('- ' + removed[i]);
    if (out.length >= limit) break;
    if (i < added.length) out.push('+ ' + added[i]);
  }
  return out;
}

function classifyFileDiff({ root, sha, filePath }) {
  if (!isSafeGitRef(sha)) {
    return { kind: 'substantive', sample: [] };
  }
  let text;
  try {
    text = execFileSync(
      'git',
      ['diff', '--unified=3', '--no-color', sha, '--', filePath],
      { cwd: root, encoding: 'utf8' }
    );
  } catch {
    return { kind: 'substantive', sample: [] };
  }
  const { added, removed } = parseUnifiedDiff(text);
  if (added.length === 0 && removed.length === 0) {
    return { kind: 'substantive', sample: [] };
  }
  if (isWhitespaceOnly(added, removed)) {
    return { kind: 'whitespace-only', sample: [] };
  }
  if (isCommentOnly(filePath, added, removed)) {
    return { kind: 'comment-only', sample: [] };
  }
  return { kind: 'substantive', sample: buildSample(added, removed) };
}

module.exports = {
  classifyFileDiff,
  parseUnifiedDiff,
  isWhitespaceOnly,
  isCommentOnly,
  buildSample,
};
