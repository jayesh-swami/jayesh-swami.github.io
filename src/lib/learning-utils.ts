import { getCollection, type CollectionEntry } from 'astro:content'
import learningNotes from '@/content/learning-notes.json'

export type LearningEntry = CollectionEntry<'learning'>
export type LearningPostEntry = CollectionEntry<'learningPosts'>

export async function getAllLearning(): Promise<LearningEntry[]> {
  const entries = await getCollection('learning')
  return entries.sort(
    (a, b) => {
      const aDate = a.data.start_date ?? a.data.event_log?.find((e: any) => e.type === 'start')?.date
      const bDate = b.data.start_date ?? b.data.event_log?.find((e: any) => e.type === 'start')?.date
      return (bDate?.valueOf() ?? 0) - (aDate?.valueOf() ?? 0)
    },
  )
}

export async function getLearningBySlug(
  slug: string,
): Promise<LearningEntry | null> {
  const entries = await getCollection('learning')
  return entries.find((entry) => getSlug(entry.id) === slug) ?? null
}

export function getSlug(id: string): string {
  return id.split('/').slice(-2, -1)[0]?.toLowerCase() ?? id
}

export function getType(id: string): string {
  return id.split('/')[0]
}

export function filterByType(
  entries: LearningEntry[],
  type: string,
): LearningEntry[] {
  return entries.filter((e) => getType(e.id) === type)
}

export async function getLinkedBlogPost(
  slug: string,
): Promise<CollectionEntry<'blog'> | null> {
  const posts = await getCollection('blog')
  return posts.find((post) => post.data.learning_slug === slug) ?? null
}

export function getNotesUrl(slug: string): string | null {
  return (learningNotes as Record<string, string>)[slug] ?? null
}

export async function getLearningEntryForPost(
  post: CollectionEntry<'blog'>,
): Promise<LearningEntry | null> {
  const slug = post.data.learning_slug
  if (!slug) return null
  return getLearningBySlug(slug)
}

let slugsWithPostsCache: Set<string> | null = null

async function getSlugsWithPosts(): Promise<Set<string>> {
  if (slugsWithPostsCache) return slugsWithPostsCache
  const posts = await getCollection('learningPosts')
  slugsWithPostsCache = new Set(
    posts.map((post) => getSlug(post.id)),
  )
  return slugsWithPostsCache
}

export async function hasLearningPost(slug: string): Promise<boolean> {
  const slugs = await getSlugsWithPosts()
  return slugs.has(slug)
}

export async function getLearningWithPosts(): Promise<LearningEntry[]> {
  const entries = await getAllLearning()
  const slugs = await getSlugsWithPosts()
  return entries.filter((e) => slugs.has(getSlug(e.id)))
}

export async function getLearningPost(
  slug: string,
): Promise<LearningPostEntry | null> {
  const posts = await getCollection('learningPosts')
  return posts.find((post) => post.id.startsWith(slug)) ?? null
}
