# Portfolio notes

Evidenote is a full-stack portfolio MVP built from Vercel's open-source Chatbot template. Be transparent about that starting point and discuss the features and engineering decisions you personally added.

## Resume bullet drafts

- Built an evidence-grounded learning assistant that chunks user notes, creates 1,536-dimensional embeddings, retrieves account-scoped passages with pgvector/HNSW, and generates answers with inspectable citations.
- Implemented authenticated note and study-history APIs, transactional note/index writes, input limits, JSON export, and confirmed data deletion.
- Documented retrieval, privacy, and scaling tradeoffs, including a queue-based path for resilient asynchronous indexing.

Do not claim scale, latency, accuracy, user counts, on-device processing, or production readiness until you have measured and implemented them.

## Before adding metrics

1. Create a small, representative set of notes and questions with labeled supporting passages.
2. Measure retrieval Recall@k or MRR, citation coverage, p50/p95 response latency, and provider cost per question.
3. Record the sample size, environment, model, and date with each result.
4. Report failures and tradeoffs alongside improvements. Do not use private course material in a public evaluation set.

## Interview story

Start with the user problem: AI answers are difficult to trust when the evidence is hidden. Explain how chunks and vectors are stored, why retrieval is scoped by account, how citations are built, and what happens when no evidence is found. Then discuss constraints honestly: synchronous indexing is simple for an MVP but needs a durable queue at larger volume; hosted AI improves capability but sends text to providers; export and deletion give users control but do not make the system on-device.

For Apple-oriented product discussion, focus on transparent data flows, accessible controls, export/deletion, and the future option of a SwiftUI client with local caching. For Meta-oriented systems discussion, focus on tenant isolation, idempotent background jobs, backpressure, retrieval evaluation, and cost/latency observability. These are design directions, not claims about the current implementation.
