import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

let prismaInstance: PrismaClient | null = null
let currentDatabaseUrl: string | null = null

function getSchemaFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.searchParams.get('schema') ?? 'public'
  } catch {
    return 'public'
  }
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? ''
  const schema = getSchemaFromUrl(databaseUrl)

  const pool = new Pool({
    connectionString: databaseUrl,
    options: `-c search_path=${schema}`,
  })
  const adapter = new PrismaPg(pool, { schema })

  return new PrismaClient({
    adapter,
    log: ['query'],
  })
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    // Recria a instância se a DATABASE_URL mudou
    if (!prismaInstance || currentDatabaseUrl !== process.env.DATABASE_URL) {
      prismaInstance = createPrismaClient()
      currentDatabaseUrl = process.env.DATABASE_URL ?? null
    }
    return Reflect.get(prismaInstance, prop)
  },
})
