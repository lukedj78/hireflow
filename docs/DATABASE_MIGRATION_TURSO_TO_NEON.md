# Migrazione Database: Turso (libSQL) → Neon (PostgreSQL)

> Documento decisionale per eventuale migrazione futura. Creato il 31/03/2026.

## Stato attuale

- **Database:** Turso (SQLite distribuito via libSQL)
- **ORM:** Drizzle ORM con adapter `libsql`
- **Client:** `@libsql/client` 0.15.15
- **Vector search:** Tipo custom `F32_BLOB` + funzione `vector_distance_cos()`
- **Hosting:** AWS EU-West-1 (`hireflow-db-lucadigerlando.aws-eu-west-1.turso.io`)
- **Tabelle:** 15 (user, session, account, verification, passwordResetTokens, organization, organizationMember, organizationInvitation, team, teamMember, jobPosting, candidate, candidateFile, application, interview, communicationLog, userSettings)

## Cosa cambia con Neon

### Schema (`lib/db/schema.ts`)

| Turso | Neon | Note |
|-------|------|------|
| `sqliteTable` | `pgTable` | Tutte le 15 tabelle |
| `text("field")` | `text("field")` | Identico |
| `integer("field")` | `integer("field")` | Identico |
| `integer` per booleani | `boolean("field")` | Es. `isPremium`, `emailVerified` |
| `text` per date | `timestamp("field")` | Es. `createdAt`, `updatedAt` |
| `text` per JSON | `jsonb("field")` | Es. `skills`, `experience`, `metadata` |
| `real("field")` | `real("field")` | Identico |
| Custom `float32Array` (BLOB) | `vector("field", { dimensions: N })` via pgvector | Embeddings |

### Connection (`lib/db/index.ts`)

```ts
// ATTUALE (Turso)
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
export const db = drizzle(client, { schema });

// NEON
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Drizzle config (`drizzle.config.ts`)

```ts
// ATTUALE
export default { dialect: "turso", ... }

// NEON
export default { dialect: "postgresql", ... }
```

### Dipendenze (`package.json`)

```diff
- "@libsql/client": "^0.15.15"
+ "@neondatabase/serverless": "^0.9.0"
```

### Vector search (`lib/server/ai-actions.ts`)

Richiede abilitazione `pgvector` extension su Neon (`CREATE EXTENSION IF NOT EXISTS vector;`).

```sql
-- ATTUALE (Turso, ai-actions.ts:219-232)
SELECT *, vector_distance_cos(candidate.embedding, ?) AS similarity
FROM candidate
WHERE candidate.embedding IS NOT NULL
ORDER BY vector_distance_cos(candidate.embedding, ?) ASC
LIMIT ?

-- NEON (pgvector)
SELECT *, candidate.embedding <=> ? AS similarity
FROM candidate
WHERE candidate.embedding IS NOT NULL
ORDER BY candidate.embedding <=> ? ASC
LIMIT ?
```

Il tipo embedding in schema passa da custom `float32Array` a:
```ts
import { vector } from "drizzle-orm/pg-core";
// ...
embedding: vector("embedding", { dimensions: 1536 }), // text-embedding-3-small = 1536 dims
```

### Environment variables

```diff
- TURSO_DATABASE_URL=libsql://...
- TURSO_AUTH_TOKEN=...
+ DATABASE_URL=postgresql://...neon.tech/hireflow?sslmode=require
```

## File da modificare

| File | Modifica | Effort |
|------|----------|--------|
| `lib/db/schema.ts` | Riscrivere 15 tabelle da `sqliteTable` a `pgTable`, cambiare tipi | 2-3h |
| `lib/db/index.ts` | Nuova connection | 15min |
| `drizzle.config.ts` | Cambiare dialect e credenziali | 10min |
| `lib/server/ai-actions.ts` | Query vector search (righe 219-232) + tipo embedding | 1h |
| `lib/server/ai-job-agent.tsx` | Embedding insert (riga 140-151) se il formato cambia | 30min |
| `package.json` | Swap dipendenze | 5min |
| `.env` | Nuove credenziali | 5min |
| `lib/db/seed.ts` | Adattare seed a tipi PostgreSQL | 30min |

**Effort totale stimato: ~1 giornata**

## Vantaggi di Neon

- **pgvector** maturo e performante (indici HNSW/IVFFlat per vector search veloce)
- **jsonb** nativo (query su JSON senza parse, indici GIN)
- **boolean/timestamp** nativi (schema piu' pulito e type-safe)
- **Branching** per preview environments e CI
- **Ecosystem PostgreSQL** vastissimo (tool, hosting, community)
- **Autoscaling** serverless con scale-to-zero
- **Compatibilita'** con qualsiasi hosting PostgreSQL futuro (non vendor lock-in su Neon)

## Svantaggi rispetto a Turso

- **Niente repliche edge** — Turso replica automaticamente su edge nodes per bassa latenza globale
- **Costo** leggermente piu' alto su volumi bassi (Turso ha free tier molto generoso)
- **Cold start** — Neon serverless ha cold start ~500ms su scale-to-zero (Turso e' piu' veloce da freddo)
- **Migration dati** — Serve export/import dei dati esistenti (non c'e' tool automatico SQLite→PostgreSQL)

## Quando ha senso migrare

- Se serve **vector search piu' performante** (pgvector con indici HNSW scala meglio)
- Se serve **query JSON complesse** (filtrare candidati per skills specifiche senza parse)
- Se il team cresce e serve **branching database** per feature branches
- Se si vuole evitare **vendor lock-in** su libSQL/Turso

## Quando NON ha senso

- Se il volume resta basso (< 10k candidati) — Turso funziona bene
- Se la latenza edge e' critica (utenti globali)
- Se non c'e' budget di tempo per la migrazione
