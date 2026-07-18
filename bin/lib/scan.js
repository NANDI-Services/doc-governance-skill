const fs = require('fs');
const path = require('path');

const EXCLUDE_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next', 'target',
  'vendor', '.venv', 'venv', '.doc-governance', '.ai'
]);

function isPathLike(s) {
  if (!s || s.length > 200) return false;
  if (s.includes(' ')) return false;
  if (s.includes('/')) return /^[\w./@\-]+$/.test(s);
  if (/\.[a-zA-Z0-9]{1,10}$/.test(s)) return /^[\w.\-]+$/.test(s);
  return false;
}

function extractHeadings(content) {
  const headings = [];
  const lines = content.split(/\r?\n/);
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) headings.push({ level: m[1].length, text: m[2].trim() });
  }
  return headings;
}

function extractCodeRefs(content) {
  const refs = new Set();
  for (const m of content.matchAll(/`([^`\n]+)`/g)) {
    const c = m[1].trim();
    if (isPathLike(c)) refs.add(c);
  }
  for (const m of content.matchAll(/^```[a-zA-Z0-9_-]*\s+path=(\S+)/gm)) {
    refs.add(m[1].trim());
  }
  return [...refs].sort();
}

function extractTitle(content) {
  const lines = content.split(/\r?\n/);
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^#\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) return m[1].trim();
  }
  return null;
}

function* walkMarkdown(root, relDir = '') {
  const dir = path.join(root, relDir);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      yield* walkMarkdown(root, path.join(relDir, e.name));
    } else if (e.isFile() && /\.md$/i.test(e.name)) {
      yield path.join(relDir, e.name).replace(/\\/g, '/');
    }
  }
}

function scanRepo(root) {
  const paths = [];
  for (const p of walkMarkdown(root)) paths.push(p);
  paths.sort();
  const docs = [];
  for (const relPath of paths) {
    const abs = path.join(root, relPath);
    let content;
    try { content = fs.readFileSync(abs, 'utf8'); } catch { continue; }
    docs.push({
      path: relPath,
      title: extractTitle(content),
      headings: extractHeadings(content),
      codeRefs: extractCodeRefs(content),
    });
  }
  return docs;
}

function renderMap({ sealedSha, sealedAt, docs, toolVersion }) {
  const lines = [
    '<!-- doc-governance:map v1 -->',
    `sealed_sha: ${sealedSha || '(none)'}`,
    `sealed_at: ${sealedAt}`,
    `tool_version: ${toolVersion}`,
    '',
    '## Inventory',
    '',
  ];
  for (const doc of docs) {
    lines.push(`### ${doc.path}`);
    lines.push(`title: ${doc.title || '(untitled)'}`);
    if (doc.headings.length) {
      lines.push('headings:');
      for (const h of doc.headings) {
        lines.push(`  - H${h.level}: ${h.text}`);
      }
    } else {
      lines.push('headings: []');
    }
    if (doc.codeRefs.length) {
      lines.push('code_refs:');
      for (const ref of doc.codeRefs) {
        lines.push(`  - ${ref}`);
      }
    } else {
      lines.push('code_refs: []');
    }
    lines.push('');
  }
  return lines.join('\n');
}

module.exports = { scanRepo, renderMap };
