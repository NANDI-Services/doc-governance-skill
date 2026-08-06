// Single source of truth for the tool version. `.github/scripts/release.sh`
// rewrites the declaration below with sed, so keep it on one line, single
// quoted and semicolon-terminated — reformatting it breaks releases silently.
const TOOL_VERSION = '0.9.0';

// Versions at which the SET OF SCANNED FILES changed. A baseline sealed on one
// side of these and checked from the other is not merely stale — it is
// measuring a different universe of files, so its results are not comparable.
// Append here whenever EXCLUDE_DIRS or the ignore semantics change.
const SCAN_UNIVERSE_VERSIONS = [
  {
    version: '0.7.0',
    reason: 'EXCLUDE_DIRS gained .agents/, .claude/, graphify-out/',
  },
  {
    version: '0.8.0',
    reason: '.doc-governance/ignore began excluding docs and code',
    requiresIgnoreFile: true,
  },
];

// Strict X.Y.Z only. Anything else (including the pre-0.9.0 'update-bootstrap'
// sentinel, or a hand-edited header) returns null and is treated as unknown.
function parseSemver(s) {
  if (typeof s !== 'string') return null;
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(s.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

// Universe versions strictly inside the ordered interval (min, max]. Order-free
// on purpose: an OLD tool run against a NEW map is the same failure as the
// reverse, and the SGG incident was exactly that shape (cached 0.5.7 copy
// resolving ahead of the installed 0.8.0).
function crossedUniverseVersions(sealed, running, opts = {}) {
  const a = parseSemver(sealed);
  const b = parseSemver(running);
  if (!a || !b) return [];
  const cmp = compareSemver(a, b);
  if (cmp === 0) return [];
  const lo = cmp < 0 ? a : b;
  const hi = cmp < 0 ? b : a;
  return SCAN_UNIVERSE_VERSIONS.filter(u => {
    if (u.requiresIgnoreFile && !opts.hasIgnoreFile) return false;
    const v = parseSemver(u.version);
    if (!v) return false;
    return compareSemver(lo, v) < 0 && compareSemver(v, hi) <= 0;
  });
}

module.exports = {
  TOOL_VERSION,
  SCAN_UNIVERSE_VERSIONS,
  parseSemver,
  compareSemver,
  crossedUniverseVersions,
};
