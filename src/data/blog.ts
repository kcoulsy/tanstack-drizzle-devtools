import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import {
  authors,
  categories,
  postCategories,
  posts,
} from '#/db/schema.ts'

export const getBlogPageData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const allAuthors = await db.select().from(authors)
    const allCategories = await db.select().from(categories)
    const allPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        publishedAt: posts.publishedAt,
        authorName: authors.name,
      })
      .from(posts)
      .innerJoin(authors, eq(posts.authorId, authors.id))
    const postCategoryRows = await db
      .select({
        postId: postCategories.postId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(postCategories)
      .innerJoin(categories, eq(postCategories.categoryId, categories.id))

    return {
      authors: allAuthors,
      categories: allCategories,
      posts: allPosts,
      postCategories: postCategoryRows,
    }
  },
)
