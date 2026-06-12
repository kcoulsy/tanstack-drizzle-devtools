import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import {
  authors,
  categories,
  postCategories,
  posts,
} from '#/db/schema.ts'

const getBlogPageData = createServerFn({ method: 'GET' }).handler(async () => {
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
})

export const Route = createFileRoute('/blog')({
  loader: () => getBlogPageData(),
  component: BlogPage,
})

function BlogPage() {
  const { authors, categories, posts: postList, postCategories } =
    Route.useLoaderData()

  const categoriesByPost = postCategories.reduce<
    Record<number, Array<{ name: string; slug: string }>>
  >((acc, row) => {
    const list = acc[row.postId] ?? []
    list.push({ name: row.categoryName, slug: row.categorySlug })
    acc[row.postId] = list
    return acc
  }, {})

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Blog</h1>
      <p className="mt-2 text-gray-600">
        Authors, posts, and categories — a different set of models and queries.
      </p>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Authors ({authors.length})</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {authors.map((author) => (
            <li
              key={author.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="font-medium">{author.name}</div>
              {author.bio && (
                <p className="mt-1 text-sm text-gray-600">{author.bio}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">
          Categories ({categories.length})
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category.id}
              className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
            >
              {category.name}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Posts ({postList.length})</h2>
        <ul className="mt-3 flex flex-col gap-4">
          {postList.map((post) => (
            <li
              key={post.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-medium">{post.title}</h3>
              <p className="mt-1 text-xs text-gray-400">
                by {post.authorName}
                {post.publishedAt &&
                  ` · ${post.publishedAt.toLocaleDateString()}`}
              </p>
              <p className="mt-2 text-sm text-gray-700">{post.content}</p>
              {(categoriesByPost[post.id]?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categoriesByPost[post.id].map((cat) => (
                    <span
                      key={cat.slug}
                      className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8">
        <Link to="/" className="text-blue-600 underline hover:text-blue-800">
          ← Back to projects
        </Link>
      </p>
    </div>
  )
}
