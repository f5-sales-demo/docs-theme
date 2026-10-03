import { fileURLToPath } from 'node:url';
import { readCanonicalCorpus, writeCanonicalHierarchy } from '@f5-sales-demo/starlight-llms-txt/canonical-corpus';

export default function canonicalLlms({ contentRoot, base, title }) {
  return {
    name: 'f5-canonical-llms',
    hooks: {
      'astro:config:setup'() {
        // Validate before Astro starts processing staged content.
        const corpus = readCanonicalCorpus(contentRoot);
        if (!corpus.pages.length) throw new Error('Canonical publication has no pages');
      },
      'astro:build:done'({ dir }) {
        writeCanonicalHierarchy({ contentRoot, outputRoot: fileURLToPath(dir), base, title });
      },
    },
  };
}
