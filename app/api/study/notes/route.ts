import { embedMany, gateway } from "ai";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { client } from "@/lib/db/queries";


const MAX_NOTE_CHARACTERS = 50_000;
const MAX_CHUNKS = 70;

type NoteRow = {
  id: string;
  title: string;
  created_at: Date | string;
  chunk_count: number;
};

function chunkText(input: string) {
  const text = input.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length && chunks.length <= MAX_CHUNKS) {
    let end = Math.min(start + 1100, text.length);
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf("\n", end);
      if (paragraphBreak > start + 550) {
        end = paragraphBreak;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }
    start = Math.max(end - 140, start + 1);
  }

  return chunks;
}

async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to view your study library." },
      { status: 401 }
    );
  }

  try {
    const notes = await client.unsafe<NoteRow[]>(
      "SELECT n.id, n.title, n.created_at, COUNT(c.id)::int AS chunk_count " +
        "FROM study_notes n LEFT JOIN study_chunks c ON c.note_id = n.id " +
        "WHERE n.user_id = $1 GROUP BY n.id ORDER BY n.created_at DESC",
      [userId]
    );
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Could not load study notes", error);
    return NextResponse.json(
      { error: "Could not load the study library. Check the database setup." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save study notes." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { title?: unknown; content?: unknown }
    | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!title || title.length > 160) {
    return NextResponse.json(
      { error: "Give the note a title between 1 and 160 characters." },
      { status: 400 }
    );
  }
  if (!content || content.length > MAX_NOTE_CHARACTERS) {
    return NextResponse.json(
      { error: "Notes must contain text and stay under 50,000 characters." },
      { status: 400 }
    );
  }

  const chunks = chunkText(content);
  if (chunks.length > MAX_CHUNKS) {
    return NextResponse.json(
      { error: "This note is too long to index at once. Split it into smaller notes." },
      { status: 413 }
    );
  }

  try {
    const { embeddings } = await embedMany({
      maxParallelCalls: 2,
      model: gateway.embeddingModel("openai/text-embedding-3-small"),
      values: chunks,
    });
    const noteId = randomUUID();
    const chunkRows = chunks.map((chunk, index) => ({
      id: randomUUID(),
      noteId,
      userId,
      content: chunk,
      embedding: "[" + embeddings[index].join(",") + "]",
    }));

    await client.begin(async (transaction) => {
      await transaction.unsafe(
        "INSERT INTO study_notes (id, user_id, title, content) VALUES ($1, $2, $3, $4)",
        [noteId, userId, title, content]
      );
      await transaction.unsafe(
        "INSERT INTO study_chunks (id, note_id, user_id, content, embedding) " +
          "SELECT (item->>'id')::uuid, (item->>'noteId')::uuid, " +
          "(item->>'userId')::uuid, item->>'content', " +
          "(item->>'embedding')::vector(1536) " +
          "FROM json_array_elements($1::json) AS item",
        [JSON.stringify(chunkRows)]
      );
    });

    return NextResponse.json(
      {
        note: {
          id: noteId,
          title,
          created_at: new Date().toISOString(),
          chunk_count: chunks.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Could not index a study note", error);
    return NextResponse.json(
      {
        error:
          "Could not index this note. Check POSTGRES_URL and AI_GATEWAY_API_KEY, then try again.",
      },
      { status: 502 }
    );
  }
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to delete study notes." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Choose a valid note." }, { status: 400 });
  }

  try {
    const deleted = await client.unsafe<{ id: string }[]>(
      "DELETE FROM study_notes WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );
    if (deleted.length === 0) {
      return NextResponse.json({ error: "That note was not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Could not delete study note", error);
    return NextResponse.json(
      { error: "Could not delete this note." },
      { status: 500 }
    );
  }
}
