import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      order: z.number().optional(),
      image: image().optional(),
      tags: z.array(z.string()).optional(),
      authors: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      learning: z.boolean().optional(),
      learning_slug: z.string().optional(),
    }),
})

const learning = defineCollection({
  loader: glob({ pattern: '**/metadata.yaml', base: './src/content/data/learning' }),
  schema: z.object({
    name: z.string(),
    type: z.enum(['course', 'paper-reading', 'others']),
    status: z.enum(['in-progress', 'completed', 'paused']),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().nullable(),
    last_revision_date: z.coerce.date().nullable(),
    labels: z.array(z.string()),
    links: z.array(
      z.object({
        type: z.string(),
        url: z.string().nullable(),
      }),
    ),
    event_log: z.array(
      z.object({
        type: z.string(),
        date: z.coerce.date(),
        description: z.string(),
      }),
    ),
    context: z
      .object({
        type: z.string(),
        institution: z.string().nullable(),
        program: z.string().nullable(),
        credential_earned: z.boolean(),
        related_papers: z.array(z.string()),
      })
      .optional(),
    authors: z.array(z.string()).optional(),
    year: z.number().optional(),
    topics: z.array(z.string()).optional(),
    related_papers: z.array(z.string()).optional(),
    related_projects: z.array(z.string()).optional(),
  }),
})

const learningPosts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/learning-posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
  }),
})

export const collections = { blog, learning, learningPosts }
