import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { projects, todos, users } from '#/db/schema.ts'

type User = typeof users.$inferSelect
type Todo = typeof todos.$inferSelect
type ProjectWithOwner = {
  id: number
  name: string
  description: string | null
  status: string
  ownerName: string
}

const getProjectsPageData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const allUsers = await db.select().from(users)
    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        ownerName: users.name,
      })
      .from(projects)
      .innerJoin(users, eq(projects.ownerId, users.id))
    const allTodos = await db.select().from(todos)

    return { users: allUsers, projects: allProjects, todos: allTodos }
  },
)

export const Route = createFileRoute('/')({
  loader: () => getProjectsPageData(),
  component: ProjectsPage,
})

function ProjectsPage() {
  const { users, projects: projectList, todos: todoList } =
    Route.useLoaderData()

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Projects</h1>
      <p className="mt-2 text-gray-600">
        Users, projects, and todos — check the Drizzle devtools panel for
        queries.
      </p>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Team ({users.length})</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user: User) => (
            <li
              key={user.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Projects ({projectList.length})</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {projectList.map((project: ProjectWithOwner) => (
            <li
              key={project.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">{project.name}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="mt-1 text-sm text-gray-600">{project.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">Owner: {project.ownerName}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Todos ({todoList.length})</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {todoList.map((todo: Todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 text-sm"
            >
              <span>{todo.completed ? '✓' : '○'}</span>
              <span className={todo.completed ? 'text-gray-400 line-through' : ''}>
                {todo.title}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8">
        <Link
          to="/blog"
          className="text-blue-600 underline hover:text-blue-800"
        >
          View blog →
        </Link>
      </p>
    </div>
  )
}
