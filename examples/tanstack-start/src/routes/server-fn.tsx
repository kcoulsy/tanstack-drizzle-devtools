import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import {
  getTodosPageData,
  refreshTodos,
  toggleTodo,
} from '#/data/todos.ts'
import type { todos } from '#/db/schema.ts'

type Todo = typeof todos.$inferSelect

export const Route = createFileRoute('/server-fn')({
  loader: () => getTodosPageData(),
  component: ServerFnPage,
})

function ServerFnPage() {
  const loaderTodos = Route.useLoaderData()
  const [todoList, setTodoList] = useState(loaderTodos)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    setTodoList(loaderTodos)
  }, [loaderTodos])

  const handleRefreshTodos = async () => {
    setIsRefreshing(true)
    try {
      const refreshed = await refreshTodos()
      setTodoList(refreshed)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleToggleTodo = async (id: number) => {
    setTogglingId(id)
    try {
      const updated = await toggleTodo({ data: { id } })
      if (updated) {
        setTodoList((previous) =>
          previous.map((todo) => (todo.id === id ? updated : todo)),
        )
      }
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Server functions</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        Button-triggered server functions that run outside the route loader.
        Queries append in the Drizzle devtools panel without navigating. Server
        functions live in{' '}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">
          src/data/todos.ts
        </code>
        .
      </p>

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">Todos ({todoList.length})</h2>
          <button
            type="button"
            onClick={handleRefreshTodos}
            disabled={isRefreshing}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh todos'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          <strong>Refresh</strong> runs a read query (GET). <strong>Toggle</strong>{' '}
          runs a read plus a write query (POST).
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {todoList.map((todo: Todo) => (
            <li key={todo.id} className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => handleToggleTodo(todo.id)}
                disabled={togglingId === todo.id}
                className="rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-50 disabled:opacity-50"
              >
                {togglingId === todo.id ? '…' : 'Toggle'}
              </button>
              <span>{todo.completed ? '✓' : '○'}</span>
              <span
                className={todo.completed ? 'text-gray-400 line-through' : ''}
              >
                {todo.title}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
        <Link to="/" className="text-blue-600 underline hover:text-blue-800">
          ← Back to projects
        </Link>
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
