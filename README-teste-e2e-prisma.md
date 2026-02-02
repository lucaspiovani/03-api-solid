# Solucao: Testes E2E com Prisma e Schemas Isolados

## Problema

Ao rodar testes E2E com Vitest e Prisma usando o adapter `@prisma/adapter-pg`, os testes estavam usando o schema `public` do banco de dados ao inves do schema de teste isolado.

### Sintomas

- Erro `409 - E-mail already registered` ao rodar testes
- Queries mostrando `"public"."users"` ao inves do schema de teste
- Dados de testes anteriores interferindo em novos testes

### Causa Raiz

Dois problemas principais:

1. **Ordem de execucao**: O `PrismaClient` era instanciado no momento da importacao do modulo, antes do environment de teste modificar a `DATABASE_URL`.

2. **Adapter pg nao respeita o parametro schema**: O `@prisma/adapter-pg` nao usa automaticamente o parametro `?schema=xxx` da URL para definir o `search_path` do PostgreSQL.

## Solucao

### 1. Prisma com instanciacao lazy e deteccao de schema

Arquivo: `src/lib/prisma.ts`

```typescript
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
    // Recria a instancia se a DATABASE_URL mudou
    if (!prismaInstance || currentDatabaseUrl !== process.env.DATABASE_URL) {
      prismaInstance = createPrismaClient()
      currentDatabaseUrl = process.env.DATABASE_URL ?? null
    }
    return Reflect.get(prismaInstance, prop)
  },
})
```

**Pontos-chave:**
- Usa `Proxy` para criar o `PrismaClient` apenas quando for acessado
- Extrai o schema da URL e configura o `search_path` no Pool
- Passa o schema para o `PrismaPg` adapter
- Recria a instancia automaticamente se a `DATABASE_URL` mudar

### 2. Environment de teste do Vitest

Arquivo: `prisma/vitest-enviroment-prisma/prisma-test-enviroment.ts`

```typescript
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
    const schema = randomUUID()
    const databaseurl = generateDatabaseUrl(schema)

    console.log('DATABASE_URL:', databaseurl)

    process.env.DATABASE_URL = databaseurl

    execSync('npx prisma migrate deploy')

    return {
      async teardown() {
        // Cria nova conexao com a URL de teste para o teardown
        const pool = new Pool({ connectionString: databaseurl })
        const adapter = new PrismaPg(pool)
        const prisma = new PrismaClient({ adapter })

        await prisma.$executeRawUnsafe(
          `DROP SCHEMA IF EXISTS "${schema}" CASCADE;`,
        )
        await prisma.$disconnect()
        await pool.end()
      },
    }
  },
}
```

**Pontos-chave:**
- Nao importa o `prisma` global no topo do arquivo
- Cria um schema unico com UUID para cada execucao de teste
- No teardown, cria uma nova conexao especifica para apagar o schema

### 3. Configuracao do Vitest

Arquivo: `vite.config.mts`

```typescript
{
  plugins: [tsconfigPaths()],
  test: {
    name: 'e2e',
    include: ['src/http/controllers/**/*.spec.ts'],
    environment: './prisma/vitest-enviroment-prisma/prisma-test-enviroment.ts',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    server: {
      deps: {
        inline: ['@/lib/prisma'],
      },
    },
  },
}
```

## Como rodar os testes

```bash
# Rodar todos os testes E2E
npm run testE2E

# Rodar um arquivo especifico
npm run testE2E -- src/http/controllers/register.spec.ts

# Rodar em modo watch
npm run test:watch:e2e -- register
```

## Fluxo de execucao

1. Vitest inicia e carrega o environment `prisma`
2. O `setup()` gera um UUID e cria a URL com `?schema=uuid`
3. `process.env.DATABASE_URL` e atualizado
4. `prisma migrate deploy` cria as tabelas no novo schema
5. O teste e executado - o Proxy do prisma detecta a nova URL e cria uma conexao com o schema correto
6. O `teardown()` apaga o schema de teste

## Resultado

Antes:
```
prisma:query SELECT "public"."users"...
```

Depois:
```
prisma:query SELECT "9c611e91-9646-47f0-80d7-4bc84d69de74"."users"...
```

Cada execucao de teste usa um schema isolado, garantindo que os testes nao interfiram uns nos outros.
