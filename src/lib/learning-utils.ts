import { getCollection, type CollectionEntry } from 'astro:content'

export type LearningEntry = CollectionEntry<'learning'>
export type LearningPostEntry = CollectionEntry<'learningPosts'>

export function getLearningSortDate(entry: LearningEntry): Date | undefined {
  return entry.data.end_date ?? getLearningStartDate(entry)
}

export function getLearningStartDate(entry: LearningEntry): Date | undefined {
  return entry.data.start_date ?? entry.data.event_log?.find((e: any) => e.type === 'start')?.date
}

const STATUS_ORDER: Record<LearningEntry['data']['status'], number> = {
  'in-progress': 0,
  completed: 1,
  paused: 2,
}

export function compareByStatusThenStart(a: LearningEntry, b: LearningEntry): number {
  const byStatus = STATUS_ORDER[a.data.status] - STATUS_ORDER[b.data.status]
  if (byStatus !== 0) return byStatus
  return (getLearningStartDate(b)?.valueOf() ?? 0) - (getLearningStartDate(a)?.valueOf() ?? 0)
}

export async function getAllLearning(): Promise<LearningEntry[]> {
  const entries = await getCollection('learning')
  return entries.sort(
    (a, b) => {
      const aDate = getLearningSortDate(a)
      const bDate = getLearningSortDate(b)
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

export const LEARNING_DESCRIPTION =
  'Notes on courses, papers, and projects I\'ve worked through: what I studied, what I built, what I learnt.'

export type LearningCounts = {
  all: number
  courses: number
  papers: number
  projects: number
}

export async function getLearningCounts(): Promise<LearningCounts> {
  const allEntries = await getLearningWithPosts()
  const allCourses = filterByType(allEntries, 'courses')
  const allPapers = filterByType(allEntries, 'paper-readings')
  const allProjects = (await getCollection('projects')).length
  return {
    all: allEntries.length + allProjects,
    courses: allCourses.length,
    papers: allPapers.length,
    projects: allProjects,
  }
}

export type LearningPath = {
  params: { slug?: string }
  props:
    | { mode: 'detail'; entry: LearningEntry }
    | { mode: 'list'; entries: LearningEntry[]; currentPage: number; lastPage: number }
}

export async function getLearningPaths(
  type: string,
  pageSize: number,
): Promise<LearningPath[]> {
  const allEntries = await getAllLearning()
  const filtered = allEntries.filter((e) => e.id.startsWith(`${type}/`))
  const paths: LearningPath[] = []

  for (const entry of filtered) {
    const slug = getSlug(entry.id)
    if (await hasLearningPost(slug)) {
      paths.push({
        params: { slug },
        props: { mode: 'detail' as const, entry },
      })
    }
  }

  const withPosts = await getLearningWithPosts()
  const filteredWithPosts = filterByType(withPosts, type)
  const lastPage = Math.ceil(filteredWithPosts.length / pageSize) || 1
  if (filteredWithPosts.length === 0) {
    paths.push({
      params: { slug: undefined },
      props: { mode: 'list' as const, entries: [], currentPage: 1, lastPage: 1 },
    })
  }
  for (let i = 0; i < filteredWithPosts.length; i += pageSize) {
    const pageNum = Math.floor(i / pageSize) + 1
    paths.push({
      params: { slug: pageNum === 1 ? undefined : String(pageNum) },
      props: {
        mode: 'list' as const,
        entries: filteredWithPosts.slice(i, i + pageSize),
        currentPage: pageNum,
        lastPage,
      },
    })
  }

  return paths
}
