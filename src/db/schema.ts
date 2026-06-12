import { relations, sql } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const projects = sqliteTable('projects', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  status: text().notNull().default('active'),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const todos = sqliteTable('todos', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  completed: integer({ mode: 'boolean' }).notNull().default(false),
  projectId: integer('project_id').references(() => projects.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const authors = sqliteTable('authors', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  bio: text(),
})

export const categories = sqliteTable('categories', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull().unique(),
})

export const posts = sqliteTable('posts', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  content: text().notNull(),
  authorId: integer('author_id')
    .notNull()
    .references(() => authors.id),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
})

export const postCategories = sqliteTable(
  'post_categories',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
  },
  (table) => [primaryKey({ columns: [table.postId, table.categoryId] })],
)

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  todos: many(todos),
}))

export const todosRelations = relations(todos, ({ one }) => ({
  project: one(projects, {
    fields: [todos.projectId],
    references: [projects.id],
  }),
}))

export const authorsRelations = relations(authors, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(authors, {
    fields: [posts.authorId],
    references: [authors.id],
  }),
  postCategories: many(postCategories),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  postCategories: many(postCategories),
}))

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, {
    fields: [postCategories.postId],
    references: [posts.id],
  }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}))
