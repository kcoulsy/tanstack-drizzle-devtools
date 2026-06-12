import { config } from 'dotenv'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import * as schema from './schema.ts'

config({ path: ['.env.local', '.env'] })

const sqlite = new Database(process.env.DATABASE_URL!)
const db = drizzle(sqlite, { schema })

async function seed() {
  console.log('Seeding database...')

  sqlite.exec(`
    DELETE FROM post_categories;
    DELETE FROM posts;
    DELETE FROM categories;
    DELETE FROM authors;
    DELETE FROM todos;
    DELETE FROM projects;
    DELETE FROM users;
  `)

  const [alice, bob, carol] = await db
    .insert(schema.users)
    .values([
      { name: 'Alice Chen', email: 'alice@example.com' },
      { name: 'Bob Martinez', email: 'bob@example.com' },
      { name: 'Carol Okonkwo', email: 'carol@example.com' },
    ])
    .returning()

  const [website, mobile, analytics] = await db
    .insert(schema.projects)
    .values([
      {
        name: 'Website Redesign',
        description: 'Rebuild the marketing site with TanStack Start',
        status: 'active',
        ownerId: alice.id,
      },
      {
        name: 'Mobile App',
        description: 'React Native companion app',
        status: 'active',
        ownerId: bob.id,
      },
      {
        name: 'Analytics Dashboard',
        description: 'Internal metrics and reporting',
        status: 'paused',
        ownerId: carol.id,
      },
    ])
    .returning()

  await db.insert(schema.todos).values([
    { title: 'Set up routing', completed: true, projectId: website.id },
    { title: 'Design homepage', completed: true, projectId: website.id },
    { title: 'Add Drizzle devtools', completed: false, projectId: website.id },
    { title: 'Prototype navigation', completed: false, projectId: mobile.id },
    { title: 'Define API contracts', completed: true, projectId: mobile.id },
    { title: 'Wire up event tracking', completed: false, projectId: analytics.id },
    { title: 'Build chart components', completed: false, projectId: analytics.id },
  ])

  const [jane, mike] = await db
    .insert(schema.authors)
    .values([
      {
        name: 'Jane Rivers',
        bio: 'Writes about full-stack TypeScript and developer tooling.',
      },
      {
        name: 'Mike Holloway',
        bio: 'Database design, ORMs, and performance tuning.',
      },
    ])
    .returning()

  const [engineering, product, tutorials] = await db
    .insert(schema.categories)
    .values([
      { name: 'Engineering', slug: 'engineering' },
      { name: 'Product', slug: 'product' },
      { name: 'Tutorials', slug: 'tutorials' },
    ])
    .returning()

  const [drizzlePost, startPost, queryPost] = await db
    .insert(schema.posts)
    .values([
      {
        title: 'Why Drizzle fits TanStack Start',
        content:
          'Type-safe SQL with minimal runtime overhead makes Drizzle a natural fit for TanStack Start loaders and server functions.',
        authorId: jane.id,
        publishedAt: new Date('2026-03-01'),
      },
      {
        title: 'SSR loaders without the boilerplate',
        content:
          'TanStack Start server functions keep data fetching colocated with routes while still running only on the server.',
        authorId: jane.id,
        publishedAt: new Date('2026-03-10'),
      },
      {
        title: 'Debugging queries per request',
        content:
          'AsyncLocalStorage lets you capture exactly the queries that ran during a single page load — no global history, no polling.',
        authorId: mike.id,
        publishedAt: new Date('2026-03-15'),
      },
    ])
    .returning()

  await db.insert(schema.postCategories).values([
    { postId: drizzlePost.id, categoryId: engineering.id },
    { postId: drizzlePost.id, categoryId: tutorials.id },
    { postId: startPost.id, categoryId: engineering.id },
    { postId: startPost.id, categoryId: product.id },
    { postId: queryPost.id, categoryId: engineering.id },
    { postId: queryPost.id, categoryId: tutorials.id },
  ])

  console.log('Seed complete.')
  sqlite.close()
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
