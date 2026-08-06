#!/usr/bin/env node
// ponytail: zero-framework smokes for update.js report behavior. Each case
// spins its own tmpdir git repo, runs the real audit.js/update.js as child
// processes, and asserts on stdout. Covered: already_synced_in_diff_range
// (0.7.0), .doc-governance/ignore (0.8.0), baseline_version_drift and
// carried_from_seal (0.9.0), and the exclude-dirs generator both ways.

const os = require('os');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');
const { TOOL_VERSION, SCAN_UNIVERSE_VERSIONS, parseSemver, compareSemver } = require('./version');

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

// update.js exits 1 whenever it emits a WARNING — expected in several cases.
function runUpdate(script, cwd) {
  try { return run('node', [script], cwd); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

function initRepo(prefix) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  run('git', ['init', '--quiet'], tmp);
  run('git', ['config', 'user.email', 'test@example.com'], tmp);
  run('git', ['config', 'user.name', 'Test'], tmp);
  run('git', ['config', 'commit.gpgsign', 'false'], tmp);
  return tmp;
}

function setMapToolVersion(tmp, version) {
  const mapPath = path.join(tmp, '.doc-governance', 'map.md');
  const text = fs.readFileSync(mapPath, 'utf8');
  fs.writeFileSync(mapPath, text.replace(/^tool_version: .*$/m, 'tool_version: ' + version));
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

function demoIgnore() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-gov-ignore-'));
  const binDir = path.join(__dirname, '..');
  const auditScript = path.join(binDir, 'audit.js');
  const updateScript = path.join(binDir, 'update.js');

  try {
    run('git', ['init', '--quiet'], tmp);
    run('git', ['config', 'user.email', 'test@example.com'], tmp);
    run('git', ['config', 'user.name', 'Test'], tmp);
    run('git', ['config', 'commit.gpgsign', 'false'], tmp);

    // Two doc<->code pairs: one tracked, one to be ignored via glob.
    fs.mkdirSync(path.join(tmp, 'code'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'docs', 'plans'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'code', 'foo.js'), 'module.exports = 1;\n');
    fs.writeFileSync(path.join(tmp, 'code', 'bar.js'), 'module.exports = 2;\n');
    fs.writeFileSync(path.join(tmp, 'README.md'), '# R\n\nUses `code/foo.js`.\n');
    fs.writeFileSync(path.join(tmp, 'docs', 'plans', 'draft.md'), '# D\n\nMentions `code/bar.js`.\n');

    fs.mkdirSync(path.join(tmp, '.doc-governance'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.doc-governance', 'ignore'), 'docs/plans/**\n');

    run('git', ['add', '.'], tmp);
    run('git', ['commit', '-m', 'baseline', '--quiet'], tmp);

    run('node', [auditScript], tmp);

    // Verify map excluded the ignored doc.
    const mapText = fs.readFileSync(path.join(tmp, '.doc-governance', 'map.md'), 'utf8');
    assert(mapText.includes('### README.md'), 'expected README.md in map\n---\n' + mapText);
    assert(!mapText.includes('docs/plans/draft.md'), 'ignored doc leaked into map\n---\n' + mapText);

    // Change BOTH code files. Only foo.js (referenced by non-ignored doc) should warn.
    fs.writeFileSync(path.join(tmp, 'code', 'foo.js'), 'module.exports = 10;\n');
    fs.writeFileSync(path.join(tmp, 'code', 'bar.js'), 'module.exports = 20;\n');

    let out;
    try { out = run('node', [updateScript], tmp); }
    catch (e) { out = (e.stdout || '') + (e.stderr || ''); } // exit 1 on warning is expected

    assert(
      /code_file: code\/foo\.js/.test(out),
      'expected warning for code/foo.js\n---\n' + out
    );
    assert(
      !/code_file: code\/bar\.js/.test(out),
      'bar.js referenced only by ignored doc should NOT warn\n---\n' + out
    );
    assert(
      /SUMMARY: 0 critical, 1 warnings/.test(out),
      'expected exactly 1 warning\n---\n' + out
    );

    console.log('ok  .doc-governance/ignore filters ignored docs and their code refs');
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

// A baseline sealed before 0.7.0 maps a different set of files than the running
// tool scans (EXCLUDE_DIRS changed). That is the SGG incident: a cached 0.5.7
// copy sealed 294 docs, 257 of them local-only, and nothing said a word.
function demoVersionDrift() {
  const tmp = initRepo('doc-gov-version-drift-');
  const binDir = path.join(__dirname, '..');

  try {
    fs.mkdirSync(path.join(tmp, 'code'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'code', 'foo.js'), 'module.exports = 1;\n');
    fs.writeFileSync(path.join(tmp, 'X.md'), '# X\n\nRefers to `code/foo.js`.\n');
    run('git', ['add', '.'], tmp);
    run('git', ['commit', '-m', 'baseline', '--quiet'], tmp);

    run('node', [path.join(binDir, 'audit.js')], tmp);
    setMapToolVersion(tmp, '0.6.0'); // pre-0.7.0: crosses the EXCLUDE_DIRS change

    const out = runUpdate(path.join(binDir, 'update.js'), tmp);

    assert(/baseline_version_drift/.test(out), 'expected baseline_version_drift\n---\n' + out);
    assert(out.includes('sealed_with: 0.6.0'), 'expected sealed_with: 0.6.0\n---\n' + out);
    assert(
      out.includes('running: ' + TOOL_VERSION),
      'expected running: ' + TOOL_VERSION + '\n---\n' + out
    );
    assert(
      /universe_changed: 0\.7\.0 /.test(out),
      'expected the 0.7.0 universe change to be named\n---\n' + out
    );
    assert(
      /SUMMARY: 0 critical, 1 warnings/.test(out),
      'expected exactly 1 warning (the version drift itself)\n---\n' + out
    );

    console.log('ok  baseline_version_drift across a scan-universe change — WARNING');
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

// A version mismatch that crosses no universe change is worth saying, not worth
// failing on — otherwise every patch release blocks every consumer.
function demoVersionDriftInfo() {
  const tmp = initRepo('doc-gov-version-info-');
  const binDir = path.join(__dirname, '..');

  // Derived, not hardcoded: sits above every universe version, so it can only
  // stop being a no-crossing case if someone adds a new one — and then this
  // test fails loudly, which is the point.
  const highest = SCAN_UNIVERSE_VERSIONS
    .map(u => parseSemver(u.version))
    .sort(compareSemver)
    .pop();
  const sealedWith = highest[0] + '.' + highest[1] + '.' + (highest[2] + 1);

  try {
    fs.writeFileSync(path.join(tmp, 'X.md'), '# X\n');
    run('git', ['add', '.'], tmp);
    run('git', ['commit', '-m', 'baseline', '--quiet'], tmp);

    run('node', [path.join(binDir, 'audit.js')], tmp);
    setMapToolVersion(tmp, sealedWith);

    const out = runUpdate(path.join(binDir, 'update.js'), tmp);

    assert(/baseline_version_drift/.test(out), 'expected baseline_version_drift\n---\n' + out);
    assert(
      !/universe_changed:/.test(out),
      'no universe version is crossed by ' + sealedWith + '..' + TOOL_VERSION + '\n---\n' + out
    );
    assert(
      /SUMMARY: 0 critical, 0 warnings, 1 info/.test(out),
      'expected INFO only, zero warnings\n---\n' + out
    );

    console.log('ok  baseline_version_drift without a universe change — INFO only');
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

// The reseal-drift repro: audit.js scans the worktree but seals HEAD, so the
// commit that carries the fresh map used to be reported as drift against the
// baseline it just established. "Freshly resealed, clean" must be reachable.
function demoResealCarry() {
  const tmp = initRepo('doc-gov-reseal-carry-');
  const binDir = path.join(__dirname, '..');
  const auditScript = path.join(binDir, 'audit.js');
  const updateScript = path.join(binDir, 'update.js');

  try {
    fs.mkdirSync(path.join(tmp, 'code'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'code', 'foo.js'), 'module.exports = 1;\n');
    fs.writeFileSync(path.join(tmp, 'X.md'), '# X\n\nRefers to `code/foo.js`.\n');
    run('git', ['add', '.'], tmp);
    run('git', ['commit', '-m', 'baseline', '--quiet'], tmp);

    // Real change lands in the worktree, then the human reseals and commits
    // both together — exactly the flow SKILL.md prescribes.
    fs.writeFileSync(path.join(tmp, 'code', 'foo.js'), 'module.exports = 2;\n');
    run('node', [auditScript], tmp);

    const mapText = fs.readFileSync(path.join(tmp, '.doc-governance', 'map.md'), 'utf8');
    assert(
      /^sealed_dirty:$/m.test(mapText) && /^ {2}- [0-9a-f]{40} code\/foo\.js$/m.test(mapText),
      'expected code/foo.js recorded in sealed_dirty with its content hash\n---\n' + mapText
    );

    run('git', ['add', '.'], tmp);
    run('git', ['commit', '-m', 'change + reseal', '--quiet'], tmp);

    const out = runUpdate(updateScript, tmp);
    assert(
      out.includes('carried_from_seal: code/foo.js'),
      'expected code/foo.js carried from the seal, not warned\n---\n' + out
    );
    assert(
      !/code_file: code\/foo\.js/.test(out),
      'the reseal commit must not warn about its own files\n---\n' + out
    );
    assert(
      /SUMMARY: 0 critical, 0 warnings/.test(out),
      'expected a clean run right after reseal+commit\n---\n' + out
    );

    // A later, genuine edit to the same path must warn again — content
    // identity, not blanket suppression.
    fs.writeFileSync(path.join(tmp, 'code', 'foo.js'), 'module.exports = 3;\n');
    const out2 = runUpdate(updateScript, tmp);
    assert(
      /code_file: code\/foo\.js/.test(out2),
      'a new edit to a carried path must warn again\n---\n' + out2
    );
    assert(
      /SUMMARY: 0 critical, 1 warnings/.test(out2),
      'expected exactly 1 warning after the new edit\n---\n' + out2
    );

    console.log('ok  carried_from_seal — reseal commit lands clean, later edits still warn');
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

// Both directions. A --check that cannot go red is not a check.
function demoSyncExcludeDirs() {
  const script = path.join(__dirname, 'sync-exclude-dirs.js');
  const repoRoot = path.join(__dirname, '..', '..');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-gov-sync-'));

  try {
    run('node', [script, '--check'], repoRoot);

    const copy = path.join(tmp, 'SKILL.md');
    const text = fs.readFileSync(path.join(repoRoot, 'SKILL.md'), 'utf8');
    fs.writeFileSync(copy, text.replace(
      /(<!-- exclude-dirs:start -->)[\s\S]*?(<!-- exclude-dirs:end -->)/,
      '$1\n- Scans every `*.md` in the repo (skipping `.git`).\n$2'
    ));

    let detected = false;
    try { run('node', [script, '--check', copy], repoRoot); }
    catch { detected = true; }
    assert(detected, 'a stale exclude-dirs line must fail --check');

    run('node', [script, '--fix', copy], repoRoot);
    run('node', [script, '--check', copy], repoRoot);

    console.log('ok  sync-exclude-dirs — detects a stale list and repairs it');
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

demo();
demoIgnore();
demoVersionDrift();
demoVersionDriftInfo();
demoResealCarry();
demoSyncExcludeDirs();
