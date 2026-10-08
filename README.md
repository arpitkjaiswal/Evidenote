# StudyMate AI

StudyMate is a private study workspace. Add course notes, ask questions against your own material, and see which passages support each answer.

## What it does

- Saves notes per signed-in user in PostgreSQL.
- Imports pasted text or local .txt and .md files.
- Splits notes into overlapping passages and creates embeddings.
- Uses pgvector similarity search to retrieve relevant passages.
- Answers with the Vercel AI SDK and lists the source passages.
- Stores study questions and answers in your database.

The app is based on [Vercel's Chatbot template](https://github.com/vercel/chatbot), which provides the Next.js app, authentication, chat UI, and database foundation. The upstream template is licensed under Apache 2.0; its LICENSE file is kept in this repository.

## Run locally

You need Node.js 20 or newer, pnpm, a Neon Postgres project, and a Vercel AI Gateway key for local AI requests.

1. Install packages with **pnpm install**.
2. Copy **.env.example** to **.env.local**.
3. Set **AUTH_SECRET**, **POSTGRES_URL**, and **AI_GATEWAY_API_KEY** in **.env.local**.
4. Apply the database migrations with **pnpm db:migrate**.
5. Start the app with **pnpm dev**.
6. Open **http://localhost:3000/study**, add a note, and ask a question.

The starter creates a guest session automatically. Register an account to keep your notes separate from the guest account.

## Connect the database and AI

Follow [Database and AI setup](docs/DATABASE_AND_AI.md) for the Neon connection string, pgvector migration, AI Gateway key, and deployment steps. Keep **.env.local** private; it is ignored by Git.

## How the answer is grounded

1. Your note text is divided into short overlapping passages.
2. The AI Gateway creates a 1,536-dimensional embedding for each passage.
3. PostgreSQL stores the text and vectors in **study_chunks**.
4. A question is embedded and matched against only the signed-in user's passages.
5. The model receives the question and the closest passages, then returns an answer with source numbers.

Notes and question history stay in the configured database. Text sent to the AI Gateway is used for embedding and answer generation. The app does not currently extract PDF files.

## Using an AI coding assistant

See [AI development workflow](docs/AI_WORKFLOW.md) for prompts to ask for a plan, a small implementation, database changes, and review. Keep API keys out of prompts and commits.

## Next steps

The current version supports text and Markdown notes. It does not yet extract PDFs, organize notes into courses, or generate quizzes. See the [roadmap](docs/ROADMAP.md) for the launch setup and a suggested order for adding those features.

## License and attribution

StudyMate changes the Vercel Chatbot template. The original template license is Apache License 2.0; see [LICENSE](LICENSE) and [NOTICE](NOTICE) for attribution.
