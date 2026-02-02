---
## Configuração TypeScript: Problema Resolvido (2025 vs 2023)

### Contexto

Durante o desenvolvimento, identificamos incompatibilidades entre duas versões do `tsconfig.json`:
- **Versão 2023**: Configuração funcional e testada ✅
- **Versão 2025**: Configuração com problemas de compatibilidade ❌

### Problemas Identificados na Configuração 2025

A configuração mais recente apresentava os seguintes problemas:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2020",
    "types": [],                        // ❌ PROBLEMA 1: Desabilita todos os tipos globais
    "jsx": "react-jsx",                 // ❌ PROBLEMA 2: Desnecessário para backend
    "verbatimModuleSyntax": true,       // ❌ PROBLEMA 3: Sintaxe muito estrita
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
    // ❌ PROBLEMA 4: Falta esModuleInterop
    // ❌ PROBLEMA 5: Falta forceConsistentCasingInFileNames
  }
}
```

#### Detalhamento dos Problemas:

1. **`"types": []`**
   - Desabilita TODOS os tipos globais, incluindo `@types/node`
   - Causa erros de tipagem em código Node.js
   - Impede uso correto de APIs do Node.js

2. **`"jsx": "react-jsx"`**
   - Configuração específica para projetos React
   - Completamente desnecessária para aplicações backend
   - Adiciona overhead desnecessário

3. **`"verbatimModuleSyntax": true`**
   - Força sintaxe de módulo extremamente estrita
   - Causa problemas de compatibilidade entre CommonJS e ES Modules
   - Dificulta importações padrão do Node.js

4. **Ausência de `esModuleInterop`**
   - Sem essa opção, importações de módulos CommonJS ficam incompatíveis
   - Causa erros ao importar bibliotecas como Fastify
   - Impede uso de sintaxe moderna de imports

5. **Ausência de `forceConsistentCasingInFileNames`**
   - Não valida consistência de maiúsculas/minúsculas em imports
   - Pode causar problemas em sistemas case-sensitive (Linux/Mac)

### Solução Aplicada (Configuração 2023)

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",

    // ✅ Compatibilidade de módulos
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,

    // ✅ Type checking rigoroso
    "strict": true,
    "skipLibCheck": true

    // ✅ Sem "types": []
    // ✅ Sem "jsx": "react-jsx"
    // ✅ Sem "verbatimModuleSyntax": true
  }
}
```

### Correções Aplicadas no Código

#### Antes (com erro):

**app.ts:**
```typescript
import fastify from 'fastify';
export const app = fastify();
```

**server.ts:**
```typescript
import app from './app'; // ❌ Incompatível com named export
```

#### Depois (corrigido):

**app.ts:**
```typescript
import fastify from 'fastify';
export const app = fastify(); // Named export
```

**server.ts:**
```typescript
import { app } from './app'; // ✅ Named import compatível
```

### Configurações Essenciais para Projetos Node.js/TypeScript

```json
{
  "compilerOptions": {
    // Ambiente
    "target": "es2020",
    "module": "commonjs",

    // Interoperabilidade (ESSENCIAL)
    "esModuleInterop": true,                    // Compatibilidade CommonJS ↔ ES Modules
    "forceConsistentCasingInFileNames": true,   // Validação de casing

    // Type Checking
    "strict": true,                             // Ativa todas verificações estritas
    "skipLibCheck": true                        // Performance em libs externas
  }
}
```

### Scripts Disponíveis

```bash
# Desenvolvimento com hot reload
npm run start:dev
```

### Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Fastify** - Framework web de alta performance
- **tsx** - TypeScript executor para desenvolvimento

### Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run start:dev
```

O servidor estará disponível em `http://localhost:3333`

### Lições Aprendidas

1. **Nem sempre o mais novo é melhor**: A configuração de 2023 é mais adequada que a de 2025 para este projeto
2. **Configurações padrão podem ser problemáticas**: Templates automáticos podem incluir configurações inadequadas
3. **`esModuleInterop` é essencial**: Para projetos Node.js/TypeScript que usam bibliotecas CommonJS
4. **Simplicidade funciona**: Menos configurações podem significar menos problemas

### Referências

- [TypeScript tsconfig.json Reference](https://aka.ms/tsconfig)
- [Fastify Documentation](https://www.fastify.io/)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)

---

**Data da correção**: 06/12/2025
**Versão do TypeScript**: 5.9.3