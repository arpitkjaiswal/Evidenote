# StudyMate roadmap

The current starter covers sign-in, a private notes library, text and Markdown import, semantic retrieval, cited answers, and saved study history. The first launch still needs your database and AI credentials.

## Set up before the first run

1. Create a Neon Postgres project and copy its pooled connection string into `.env.local` as `POSTGRES_URL`.
2. Set `AUTH_SECRET` to a new random value and add an AI Gateway key as `AI_GATEWAY_API_KEY`.
3. Run `pnpm install`, `pnpm db:migrate`, then `pnpm dev`.
4. Open `/study`, create a note, and ask a question. Keep `.env.local` private.

See [Database and AI setup](DATABASE_AND_AI.md) for details.

## Build toward a production release

Work through these in order and keep each change in a small branch:

1. **Validate the core flow:** add automated coverage for note ownership, indexing, retrieval, citations, and deletion; run lint, type checks, and a production build.
2. **Organize the library:** add courses or collections, note search, editing, and a way to re-index changed notes.
3. **Support more sources:** add PDF extraction with file size and page limits, and show import progress and failures.
4. **Improve study tools:** generate quizzes and flashcards from retrieved passages, with citations on each answer.
5. **Measure answer quality:** keep a small set of sample notes and questions, check retrieval relevance and citation coverage, and compare changes before switching models or chunking rules.
6. **Prepare deployment:** set server-only environment variables in the hosting dashboard, use a separate production database, configure backups and usage limits, and verify sign-in and data deletion on the deployed site.

For each feature, ask an AI coding assistant to inspect the existing routes and migration first, implement one small step, explain the diff, and review access control and failure states. Use the prompts in [AI development workflow](AI_WORKFLOW.md). Never give an assistant your `.env.local` file or private course material.
