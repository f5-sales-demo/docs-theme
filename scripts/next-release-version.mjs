import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PATCH_TYPES = new Set(['build', 'chore', 'ci', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']);
const LEVEL_WEIGHT = { patch: 1, minor: 2, major: 3 };

export function releaseLevel(commits) {
  let selected = null;

  for (const { subject, body } of commits) {
    let candidate = null;

    if (/^[a-z]+(?:\([^)\r\n]+\))?!:/i.test(subject) || /^BREAKING(?: |-)?CHANGE:\s/m.test(body)) {
      candidate = 'major';
    } else {
      const match = /^([a-z]+)(?:\([^)\r\n]+\))?:/i.exec(subject);
      const type = match?.[1].toLowerCase();

      if (type === 'feat') candidate = 'minor';
      else if (type && PATCH_TYPES.has(type)) candidate = 'patch';
    }

    if (candidate && (!selected || LEVEL_WEIGHT[candidate] > LEVEL_WEIGHT[selected])) selected = candidate;
  }

  return selected;
}

export function nextVersion(previousTag, level) {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(previousTag);
  if (!match) throw new Error(`Expected a stable semantic version tag, received ${previousTag}`);

  let [, major, minor, patch] = match.map(Number);
  if (level === 'major') [major, minor, patch] = [major + 1, 0, 0];
  else if (level === 'minor') [minor, patch] = [minor + 1, 0];
  else if (level === 'patch') patch += 1;
  else throw new Error(`Unknown release level: ${level}`);

  return `${major}.${minor}.${patch}`;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function latestStableTag() {
  const tags = git(['tag', '--merged', 'HEAD', '--list', 'v[0-9]*', '--sort=-version:refname']).split('\n');
  const tag = tags.find((candidate) => /^v\d+\.\d+\.\d+$/.test(candidate));
  if (!tag) throw new Error('No reachable stable semantic version tag was found');
  return tag;
}

function commitsSince(tag) {
  const hashes = git(['log', '--format=%H', `${tag}..HEAD`]);
  if (!hashes) return [];

  return hashes.split('\n').map((hash) => ({
    subject: git(['show', '--no-patch', '--format=%s', hash]),
    body: git(['show', '--no-patch', '--format=%b', hash]),
  }));
}

function main() {
  const previousTag = latestStableTag();
  const level = releaseLevel(commitsSince(previousTag));

  if (!level) {
    process.stdout.write(`release=false\nprevious_tag=${previousTag}\n`);
    return;
  }

  const version = nextVersion(previousTag, level);
  process.stdout.write(
    `${[`release=true`, `level=${level}`, `previous_tag=${previousTag}`, `version=${version}`, `tag=v${version}`].join(
      '\n',
    )}\n`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
