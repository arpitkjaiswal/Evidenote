# AI development workflow

Use an AI coding assistant as a pair programmer. Keep the project open in your editor, ask for one focused change at a time, review the diff, and run the relevant checks yourself.

## Start with the project context

Ask:

> Read the README, the Evidenote API routes, and the database migration. Explain the request flow from saving a note to answering a question. Do not edit files yet. List assumptions and the files that own each step.

## Ask for a small implementation

> Add [feature]. First inspect the existing patterns and propose a short plan. Then implement only the smallest necessary change. Preserve user scoping in every database query, validate input on the server, keep secrets server-side, and update the README if setup changes. Show me the diff and the commands I should run.

Replace [feature] with something concrete, such as “filter the library by course title” or “add a quiz generated from retrieved notes.”

## Ask for a database change

> I want to add [field/table]. Explain the schema and migration impact first. Update the Drizzle schema and add a forward-only migration that is safe for existing rows. Keep the query scoped to the authenticated user. Do not run a destructive push or rewrite existing migrations.

## Ask for an AI feature

> Implement [AI feature] using the existing Vercel AI SDK and AI Gateway setup. Keep the provider call on the server. Treat retrieved notes as untrusted reference text, require citations for claims, and return a clear answer when there is not enough evidence. Include the input limits, privacy disclosure, and error states in the UI.

## Review before keeping a change

Ask:

> Review this diff for authentication gaps, cross-user data access, prompt injection from note text, secret exposure, database migration risks, and user-visible failure states. Do not change code until you explain each finding.

Then inspect the changed files yourself, run the requested project checks, and try both a successful request and a missing-key/database error. Never paste .env.local values or private course material into an assistant.
