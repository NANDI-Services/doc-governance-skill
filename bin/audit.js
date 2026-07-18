#!/usr/bin/env node
// ponytail: last-writer-wins map file. Add flock if concurrent audit becomes real.

const { scanRepo, renderMap } = require('./lib/scan');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOOL_VERSION = '0.4.0';

function findRepoRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  } catch {
    return process.cwd();
  }
}

function getSealedSha(root) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function main() {
  const root = findRepoRoot();
  const docs = scanRepo(root);
  const sealedSha = getSealedSha(root);
  const sealedAt = new Date().toISOString();
  const content = renderMap({ sealedSha, sealedAt, docs, toolVersion: TOOL_VERSION });
  const outDir = path.join(root, '.doc-governance');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'map.md'), content);
  const shortSha = sealedSha ? sealedSha.slice(0, 7) : '(no-git)';
  console.log(`Wrote ${docs.length} doc(s) to .doc-governance/map.md (SHA: ${shortSha})`);
}

try {
  main();
} catch (err) {
  console.error(`[doc-governance-audit] ${err.message}`);
  process.exit(1);
}
