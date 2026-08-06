#!/usr/bin/env node
// Resolves WHICH installed copy of the skill should run.
//
// Why this exists: the old instruction was `find <cache> | head -1`, which
// returns whatever the filesystem lists first — not the newest. With two copies
// installed side by side that is a coin flip, and it is the exact mechanism
// behind the SGG incident (agent read 0.9.0's SKILL.md, executed 0.8.0's bin/).
// Picking the highest version is a precondition for the 0.9.0 baseline guard to
// mean anything: that guard lives in the code, so it only fires if the copy
// that runs actually has it.
//
//   node bin/which.js              -> absolute path of the copy to use
//   node bin/which.js --verbose    -> every copy found, with versions
//   node bin/which.js --root <dir> -> test hook: treat <dir> as ~/.claude and
//                                     skip the cwd/self candidates
//
// Exit 1 when nothing is found, so callers can fall back with `||`.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseSemver, compareSemver } = require('./lib/version');

const SKILL_NAME = 'doc-governance-skill';

function parseArgs(argv) {
  const args = { verbose: false, root: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--verbose' || argv[i] === '-v') { args.verbose = true; continue; }
    if (argv[i] === '--root') { args.root = argv[++i]; continue; }
    if (argv[i].startsWith('--root=')) { args.root = argv[i].slice(7); continue; }
  }
  return args;
}

function safeSubdirs(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isDirectory() || e.isSymbolicLink())
      .map(e => e.name);
  } catch {
    return [];
  }
}

// ~/.claude/plugins/cache/<marketplace>/doc-governance-skill/<commit>/ and
// ~/.claude/skills/doc-governance-skill/. The marketplace segment is globbed,
// not hardcoded to `nandi-services` — anyone can add the marketplace under
// another name and the copy is just as real.
function candidatesFromClaudeDir(claudeDir) {
  const out = [];
  const cacheRoot = path.join(claudeDir, 'plugins', 'cache');
  for (const marketplace of safeSubdirs(cacheRoot)) {
    const pluginDir = path.join(cacheRoot, marketplace, SKILL_NAME);
    for (const commit of safeSubdirs(pluginDir)) {
      out.push(path.join(pluginDir, commit));
    }
  }
  out.push(path.join(claudeDir, 'skills', SKILL_NAME));
  return out;
}

function collectCandidates(args) {
  if (args.root) return candidatesFromClaudeDir(args.root);
  const out = candidatesFromClaudeDir(path.join(os.homedir(), '.claude'));
  const cwd = process.cwd();
  out.push(path.join(cwd, '.ai', 'skills', SKILL_NAME));
  out.push(path.join(cwd, '.agents', 'skills', SKILL_NAME));
  // The copy this script belongs to, which may live anywhere — a dev checkout,
  // a vendored drop, a path nobody enumerated.
  out.push(path.join(__dirname, '..'));
  return out;
}

function readVersion(skillMdPath) {
  let text;
  try { text = fs.readFileSync(skillMdPath, 'utf8'); } catch { return null; }
  const m = /^version:\s*(.+)$/m.exec(text.split(/\r?\n/).slice(0, 15).join('\n'));
  return m ? m[1].trim() : null;
}

// Deduplicated by REAL path: ~/.claude/skills/doc-governance-skill is commonly a
// symlink (it is on the machine this was written for), and without resolving it
// the same copy shows up twice and the "multiple copies" warning cries wolf.
function resolveCopies(args) {
  const seen = new Set();
  const copies = [];
  const selfReal = tryRealpath(path.join(__dirname, '..'));
  for (const dir of collectCandidates(args)) {
    const real = tryRealpath(dir);
    if (!real || seen.has(real)) continue;
    if (!fs.existsSync(path.join(real, 'SKILL.md'))) continue;
    seen.add(real);
    const version = readVersion(path.join(real, 'SKILL.md'));
    copies.push({ path: real, version, semver: parseSemver(version), isSelf: real === selfReal });
  }
  return copies;
}

function tryRealpath(p) {
  try { return fs.realpathSync(p); } catch { return null; }
}

// Highest version wins. An unparseable version sorts below every valid one, so
// it can only win by being the only copy.
function pickBest(copies) {
  return copies.slice().sort((a, b) => {
    if (a.semver && b.semver) return compareSemver(b.semver, a.semver);
    if (a.semver) return -1;
    if (b.semver) return 1;
    return 0;
  })[0];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const copies = resolveCopies(args);
  if (!copies.length) {
    if (args.verbose) console.error('no installed copy of ' + SKILL_NAME + ' found');
    return 1;
  }
  const best = pickBest(copies);

  if (!args.verbose) {
    console.log(best.path);
    return 0;
  }

  for (const c of copies) {
    const marks = [];
    if (c === best) marks.push('<- selected');
    if (c.isSelf) marks.push('(running this)');
    console.log('  ' + (c.version || '(no version)').padEnd(12) + c.path +
      (marks.length ? '  ' + marks.join(' ') : ''));
  }
  const distinct = new Set(copies.map(c => c.version || '(no version)'));
  if (distinct.size > 1) {
    console.log('');
    console.log('warning: ' + copies.length + ' copies installed across ' + distinct.size +
      ' versions. Whichever resolves first decides your results; remove the stale ones.');
  }
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error('[doc-governance-which] ' + err.message);
  process.exit(1);
}
