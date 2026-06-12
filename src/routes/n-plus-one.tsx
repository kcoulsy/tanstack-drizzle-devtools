import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { projects, todos, users } from '#/db/schema.ts'

type ProjectWithOwner = {
  id: number
  name: string
  description: string | null
  status: string
  ownerName: string
}

type TodoWithProject = {
  id: number
  title: string
  completed: boolean
  projectName: string | null
}

const getNPlusOnePageData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const allProjects = await db.select().from(projects)

    const projectsWithOwners: ProjectWithOwner[] = await Promise.all(
      allProjects.map(async (project) => {
        const [owner] = await db
          .select()
          .from(users)
          .where(eq(users.id, project.ownerId))

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          ownerName: owner?.name ?? 'Unknown',
        }
      }),
    )

    const allTodos = await db.select().from(todos)

    const todosWithProjects: TodoWithProject[] = await Promise.all(
      allTodos.map(async (todo) => {
        if (!todo.projectId) {
          return {
            id: todo.id,
            title: todo.title,
            completed: todo.completed,
            projectName: null,
          }
        }

        const [project] = await db
          .select({ name: projects.name })
          .from(projects)
          .where(eq(projects.id, todo.projectId))

        return {
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          projectName: project?.name ?? null,
        }
      }),
    )

    return { projects: projectsWithOwners, todos: todosWithProjects }
  },
)

export const Route = createFileRoute('/n-plus-one')({
  loader: () => getNPlusOnePageData(),
  component: NPlusOnePage,
})

function NPlusOnePage() {
  const { projects: projectList, todos: todoList } = Route.useLoaderData()

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">N+1 example</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        This page loads projects and todos with a classic N+1 pattern: one query
        for the list, then one query per row to fetch the related record. Open
        the Drizzle devtools panel — those repeated queries are highlighted in
        red.
      </p>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">
          Projects ({projectList.length})
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {projectList.map((project) => (
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
                <p className="mt-1 text-sm text-gray-600">
                  {project.description}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                Owner: {project.ownerName}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Todos ({todoList.length})</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {todoList.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm"
            >
              <span>{todo.completed ? '✓' : '○'}</span>
              <span
                className={todo.completed ? 'text-gray-400 line-through' : ''}
              >
                {todo.title}
              </span>
              {todo.projectName && (
                <span className="ml-auto text-xs text-gray-400">
                  {todo.projectName}
                </span>
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
