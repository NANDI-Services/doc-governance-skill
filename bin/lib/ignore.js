// ponytail: glob-lite parser for .doc-governance/ignore. Line-based, supports
// `#` comments, `*` (single segment), `**` (any segments), trailing `/` (dir
// prefix). No negation, no `[...]`, no `?`. Add picomatch if users need more.

const fs = require('fs');
const path = require('path');

function globToRegex(pattern) {
  const dirOnly = pattern.endsWith('/');
  const body = dirOnly ? pattern.slice(0, -1) : pattern;
  let re = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '*') {
      if (body[i + 1] === '*') { re += '.*'; i++; }
      else { re += '[^/]*'; }
    } else if (/[.+^${}()|[\]\\]/.test(ch)) {
      re += '\\' + ch;
    } else {
      re += ch;
    }
  }
  return new RegExp('^' + re + (dirOnly ? '(?:/.*)?$' : '$'));
}

function loadIgnore(root) {
  const p = path.join(root, '.doc-governance', 'ignore');
  let text;
  try { text = fs.readFileSync(p, 'utf8'); }
  catch { return { patterns: [], matches: () => false }; }
  const patterns = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    patterns.push({ src: line, re: globToRegex(line) });
  }
  return {
    patterns,
    matches(relPath) {
      const norm = relPath.replace(/\\/g, '/');
      return patterns.some(p => p.re.test(norm));
    },
  };
}

module.exports = { loadIgnore, globToRegex };
