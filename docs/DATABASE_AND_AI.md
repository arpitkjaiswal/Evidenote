# Database and AI setup

## 1. Create a Neon Postgres database

1. Create a Neon project and a database in the [Neon console](https://neon.com/).
2. Open the project's connection details and copy the pooled PostgreSQL connection string.
3. Put it in .env.local as POSTGRES_URL. Keep the whole URL, including sslmode=require.
4. Never commit .env.local or paste its contents into an AI chat.

See [Neon's connection guide](https://neon.com/docs/connect/connect-from-any-app) for where to find the connection string.

The original Vercel template already uses PostgreSQL through Drizzle and the postgres driver. StudyMate adds notes, note passages, and saved study answers to that same database.

## 2. Install the pgvector schema

Run pnpm db:migrate from the repository root. This applies the existing starter schema and the StudyMate migration in lib/db/migrations/0001_study_workspace.sql.

That migration enables the vector extension, creates the StudyMate tables and cosine HNSW index, and adds the match_study_chunks query function. If the database role cannot enable an extension, enable pgvector in the Neon SQL editor, then rerun the migration. Neon has an overview of [pgvector and HNSW search](https://neon.com/blog/understanding-vector-search-and-hnsw-index-with-pgvector).

## 3. Configure AI Gateway

1. Create an API key in the Vercel dashboard under AI Gateway → API Keys, following [Vercel's authentication guide](https://vercel.com/docs/ai-gateway/authentication-and-byok).
2. Set AI_GATEWAY_API_KEY in .env.local for local development.
3. The key is read on the server only. Do not prefix it with NEXT_PUBLIC_.

StudyMate uses openai/text-embedding-3-small for note and question embeddings with the [AI SDK embedding API](https://ai-sdk.dev/docs/ai-sdk-core/embeddings), and the template's configured default chat model for answers. AI Gateway usage may incur provider charges; check current model pricing and account limits before indexing large note collections.

## 4. Start and use the app

Run pnpm dev and open /study. Add a title and paste notes, or import a .txt or .md file. After the note is indexed, ask a question. The app displays the answer and retrieved passages beneath it.

When you deploy, add the same environment variables in your hosting provider's server-side environment settings. Do not include any key in the browser bundle.

## Data boundaries

- Notes and saved answers are scoped to the authenticated user ID.
- Deleting a note also removes its indexed passages.
- The model sees the question and retrieved note passages for that request.
- Plain text and Markdown are supported; PDF extraction is not included yet.
- A note is limited to 50,000 characters and questions to 2,000 characters to limit accidental cost spikes.
