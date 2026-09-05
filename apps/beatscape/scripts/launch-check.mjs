// Existing PRD/SESSION human gates remain separate from technical readiness.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { verifyRelease } from './release.mjs';
const app = fileURLToPath(new URL('../', import.meta.url));
const release = verifyRelease();
const catalog = JSON.parse(readFileSync(resolve(app, 'public/catalog.json')));
const signoff = JSON.parse(readFileSync(resolve(app, 'launch-signoff.json')));
const blockers = [];
for (const track of catalog.tracks) {
  if (!(track.stream_duration_sec >= track.duration_sec * 1.8)) {
    blockers.push(`${track.track_id}: stream ${track.stream_duration_sec}s < game × 1.8 (${track.duration_sec * 1.8}s)`);
  }
}
if (signoff.artifactSha256 !== release.artifactSha256) blockers.push('No sign-off for this exact release artifact');
if (!signoff.reviewedBy || !signoff.reviewedAt || !Number.isFinite(Date.parse(signoff.reviewedAt))) blockers.push('Reviewer and review date are required');
for (const field of ['contentAudit', 'earcheckReport', 'blindtestRecord', 'deviceTestRecord']) {
  const gate = signoff[field];
  if (!gate || gate.status !== 'pass' || !gate.evidence || !existsSync(resolve(app, gate.evidence))) {
    blockers.push(`${field}: passing evidence is missing (see docs/BEATSCAPE-RELEASE-READINESS.md)`);
    continue;
  }
  const bytes = readFileSync(resolve(app, gate.evidence));
  if (createHash('sha256').update(bytes).digest('hex') !== gate.sha256) blockers.push(`${field}: evidence hash is missing or changed`);
  if (field === 'contentAudit') {
    const report = JSON.parse(bytes).report;
    if (!report || report.summary?.FAIL !== 0 || report.tracks?.length !== catalog.tracks.length) blockers.push('contentAudit: a full catalog audit with FAIL=0 is required');
  }
  if (field === 'earcheckReport') {
    const report = JSON.parse(bytes);
    if (!report.reviewer || !Array.isArray(report.tracks)) { blockers.push('earcheckReport: invalid review export'); continue; }
    for (const track of catalog.tracks) {
      const review = report.tracks.find((t) => t.track_id === track.track_id);
      const stream = resolve(app, 'public', track.stream_audio.replace(/^\//, ''));
      // CI intentionally has no stream masters. The signed artifact + evidence
      // hashes bind that review; local checks additionally compare master bytes.
      if (review?.v !== 'clear' || !review.reviewedAt || !/^[a-f0-9]{64}$/.test(review.fingerprint ?? '') ||
        (existsSync(stream) && review.fingerprint !== createHash('sha256').update(readFileSync(stream)).digest('hex'))) {
        blockers.push(`earcheckReport: ${track.track_id} has no Clear verdict for the current audio`);
      }
    }
  }
}
if (blockers.length) {
  console.error(`Launch blocked:\n${blockers.map((b) => `- ${b}`).join('\n')}`);
  process.exitCode = 1;
} else console.log(`Launch sign-off verified: ${release.artifactSha256.slice(0, 12)}`);
