import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        subcategory: z.string().optional(),
        xcsh_docs: z
          .object({
            id: z.string(),
            collection_id: z.string(),
            role: z.string(),
            parent_id: z.string().nullable(),
            child_ids: z.array(z.string()),
            schema_path: z.array(z.string()),
            provider_type: z.string(),
            body_sha256: z.string(),
            source_url: z.string().optional(),
          })
          .passthrough()
          .optional(),
      }),
    }),
  }),
};
