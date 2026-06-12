import { Link, createFileRoute } from '@tanstack/react-router'

import { getBlogPageData } from '#/data/blog.ts'
import type { authors, categories } from '#/db/schema.ts'

type Author = typeof authors.$inferSelect
type Category = typeof categories.$inferSelect
type PostListItem = {
  id: number
  title: string
  content: string
  publishedAt: Date | null
  authorName: string
}
type PostCategoryRow = {
  postId: number
  categoryName: string
  categorySlug: string
}

export const Route = createFileRoute('/blog')({
  loader: () => getBlogPageData(),
  component: BlogPage,
})

function BlogPage() {
  const { authors, categories, posts: postList, postCategories } =
    Route.useLoaderData()

  const categoriesByPost = postCategories.reduce<
    Record<number, Array<{ name: string; slug: string }>>
  >((acc: Record<number, Array<{ name: string; slug: string }>>, row: PostCategoryRow) => {
    const list = acc[row.postId] ?? []
    list.push({ name: row.categoryName, slug: row.categorySlug })
    acc[row.postId] = list
    return acc
  }, {})

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Blog</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        Authors, posts, and categories. The server function and Drizzle queries
        live in{' '}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">
          src/data/blog.ts
        </code>
        — devtools source links point there, not this route file.
      </p>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Authors ({authors.length})</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {authors.map((author: Author) => (
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
          {categories.map((category: Category) => (
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
          {postList.map((post: PostListItem) => (
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
                  {categoriesByPost[post.id].map((cat: { name: string; slug: string }) => (
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
