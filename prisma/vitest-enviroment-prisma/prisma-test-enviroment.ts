import 'dotenv/config'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import type { Environment } from 'vitest/environments'

function generateDatabaseUrl(schema: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Please provide a Database URL to run the tests')
  }

  const url = new URL(process.env.DATABASE_URL)

  url.searchParams.set('schema', schema)

  return url.toString()
}

export default <Environment>{
  name: 'prisma',
  transformMode: 'ssr',
  async setup() {
    // Criar um banco de testes
    const schema = randomUUID()
    const databaseurl = generateDatabaseUrl(schema)

    console.log('DATABASE_URL:', databaseurl)

    process.env.DATABASE_URL = databaseurl

    execSync('npx prisma migrate deploy')

    return {
      async teardown() {
        // Criar uma nova conexão com a URL de teste para o teardown
        const pool = new Pool({ connectionString: databaseurl })
        const adapter = new PrismaPg(pool)
        const prisma = new PrismaClient({ adapter })

        // Apagar um banco de testes
        await prisma.$executeRawUnsafe(
          `DROP SCHEMA IF EXISTS "${schema}" CASCADE;`,
        )
        await prisma.$disconnect()
        await pool.end()
      },
    }
  },
}
