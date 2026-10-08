# Database and AI setup

## 1. Create a Neon Postgres database

1. Create a project in the [Neon console](https://neon.com/).
2. Open connection details and copy the pooled PostgreSQL connection string.
3. Put it in `.env.local` as `POSTGRES_URL`, including `sslmode=require`.
4. Keep `.env.local` private; never commit it or paste its values into an AI chat.

The original Vercel template already uses PostgreSQL through Drizzle and the postgres driver. Evidenote adds notes, indexed passages, and study history to that database.

## 2. Apply the schema

Run `pnpm db:migrate` from the repository root. This applies the original application migration and `lib/db/migrations/0001_study_workspace.sql`.

The Evidenote migration enables pgvector, creates the notes/chunks/history tables and cosine HNSW index, and adds `match_study_chunks`. If the database role cannot enable the extension, enable `vector` in the Neon SQL editor, then rerun the migration. See [Neon's pgvector/HNSW overview](https://neon.com/blog/understanding-vector-search-and-hnsw-index-with-pgvector).

## 3. Configure AI Gateway

1. Create an API key in the Vercel dashboard under AI Gateway → API Keys. See [Vercel's authentication guide](https://vercel.com/docs/ai-gateway/authentication-and-byok).
2. Set `AI_GATEWAY_API_KEY` in `.env.local` for local development.
3. Keep the key server-side; do not use a `NEXT_PUBLIC_` prefix.

Evidenote uses `openai/text-embedding-3-small` for note and question embeddings and the starter's configured default chat model for answers. AI requests may incur provider costs. Check current pricing and set usage limits before importing large collections.

## 4. Run and deploy

Run `pnpm dev` and open `/study`. Paste notes or import a `.txt` or `.md` file, then ask a question. Add the same environment variables in your hosting provider's server-side environment settings. Use a separate production database and do not expose keys in the browser bundle.

## Data flow

- Notes, chunks, vectors, questions, and answers are stored in your configured Postgres database.
- Saving a note sends its text chunks to AI Gateway for embeddings.
- Asking a question sends the question for embedding and sends retrieved passages to the configured language model.
- JSON export and study-data deletion are scoped to the signed-in account. These actions do not delete ordinary chat history or the account itself.
- Plain text and Markdown are supported; PDF extraction is not implemented yet.

See [Privacy and data flow](PRIVACY.md) for the full boundary and limitations.

