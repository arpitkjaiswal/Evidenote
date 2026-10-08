# Privacy and data flow

Evidenote is designed to make its data handling visible. It is not an on-device AI app: it stores study data in the configured PostgreSQL service and calls the configured AI Gateway for embeddings and answers.

## What is stored

- Account ID, note title, and note text.
- Text chunks and their vector embeddings.
- Study questions, answers, and the passages shown as sources.

The app scopes these study records to the signed-in account. The configured database and hosting provider operate the server-side services.

## What leaves the app for AI

- When a note is saved, its text chunks are sent to AI Gateway to create embeddings.
- When a question is asked, the question is embedded and the retrieved note passages are sent to the selected language model to generate an answer.

Provider handling and retention depend on the model/provider configuration. Check those terms before using sensitive material. Evidenote does not claim on-device processing, zero retention, or that providers do not train on requests.

## User controls

- **Export my data** downloads the signed-in user's notes and study Q&A as JSON.
- **Delete study data** removes that user's notes and study Q&A; indexed chunks are removed by database cascade. The app asks for confirmation first.
- These controls do not delete the user's account or ordinary chats in the starter's separate chat feature.

Apple's developer guidance emphasizes data minimization, clear disclosure, and processing on-device where possible ([Privacy HIG](https://developer.apple.com/design/human-interface-guidelines/privacy/)). Meta's engineering writing describes privacy-aware data understanding and controls for GenAI data flows ([Meta Engineering](https://engineering.fb.com/2025/10/23/security/scaling-privacy-infrastructure-for-genai-product-innovation/)). Evidenote applies the product-level parts it can support today—clear data flow and user controls—and documents where its cloud-backed design does not provide on-device processing.
