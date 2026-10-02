import fs from 'node:fs';
import { availableProviderSections } from './canonical-provider.ts';

const sectionsByManifest = new Map<string, ReturnType<typeof availableProviderSections>>();
export function stagedProviderSections(manifest = process.env.CANONICAL_MANIFEST || '') {
  if (!manifest) throw new Error('Canonical provider navigation requires a manifest');
  let sections = sectionsByManifest.get(manifest);
  if (!sections) {
    const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (!data.files || typeof data.files !== 'object' || Array.isArray(data.files)) {
      throw new Error('Canonical provider manifest requires file receipts');
    }
    sections = availableProviderSections(Object.keys(data.files));
    sectionsByManifest.set(manifest, sections);
  }
  return sections;
}
