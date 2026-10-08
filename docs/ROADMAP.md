# Evidenote roadmap

The current web MVP supports authenticated text/Markdown notes, semantic retrieval, cited answers, JSON export, and deletion of study data.

## Before a first run

1. Create a Neon Postgres project and copy its pooled connection string into `.env.local` as `POSTGRES_URL`.
2. Set a new `AUTH_SECRET` and an AI Gateway key as `AI_GATEWAY_API_KEY`.
3. Run `pnpm install`, `pnpm db:migrate`, and `pnpm dev`.
4. Add a small note, ask a question, inspect the citations, export the data, and try deletion with disposable data.

See [Database and AI setup](DATABASE_AND_AI.md).

## Build toward a strong portfolio release

1. **Measure retrieval quality:** label a small question-to-passage dataset and report Recall@k or MRR alongside answer citation coverage. Do not publish performance numbers until measured.
2. **Organize knowledge:** add courses or collections, note search, editing, and safe re-indexing of changed notes.
3. **Support more sources:** add PDF extraction with file, page, and text limits; show import progress and failures.
4. **Make ingestion resilient:** move embedding work to a queue with idempotency keys, retries, rate limits, and explicit indexing states.
5. **Improve study tools:** generate flashcards and quizzes from retrieved passages, and cite the source for every generated item.
6. **Add a native Apple client:** build an accessible SwiftUI companion with local caching and clear controls over what syncs to the server. Do not claim on-device AI unless it is actually implemented.
7. **Prepare deployment:** use separate development and production databases, server-only secrets, backups, budget limits, and verified export/deletion behavior.

These steps create interview discussion around data ownership, retrieval quality, asynchronous systems, and privacy tradeoffs. The [system design](SYSTEM_DESIGN.md) calls out current limits; the [portfolio guide](PORTFOLIO.md) lists truthful resume wording.

