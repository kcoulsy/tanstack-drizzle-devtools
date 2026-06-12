import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { todos } from '#/db/schema.ts'

export const getTodosPageData = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.select().from(todos)
  },
)

export const refreshTodos = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.select().from(todos)
  },
)

export const toggleTodo = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const [todo] = await db.select().from(todos).where(eq(todos.id, data.id))
    if (!todo) {
      return null
    }

    const completed = !todo.completed
    await db
      .update(todos)
      .set({ completed })
      .where(eq(todos.id, data.id))

    return { ...todo, completed }
  })
