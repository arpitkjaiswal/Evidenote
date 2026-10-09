import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { client } from "@/lib/db/queries";


type ExportNote = {
  id: string;
  title: string;
  content: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type ExportMessage = {
  id: string;
  question: string;
  answer: string;
  sources: unknown;
  created_at: Date | string;
};

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to export your study data." },
      { status: 401 }
    );
  }

  try {
    const [notes, messages] = await Promise.all([
      client.unsafe<ExportNote[]>(
        "SELECT id, title, content, created_at, updated_at " +
          "FROM study_notes WHERE user_id = $1 ORDER BY created_at ASC",
        [userId]
      ),
      client.unsafe<ExportMessage[]>(
        "SELECT id, question, answer, sources, created_at " +
          "FROM study_messages WHERE user_id = $1 ORDER BY created_at ASC",
        [userId]
      ),
    ]);

    const exportData = {
      format: "evidenote-export-v1",
      exported_at: new Date().toISOString(),
      notes,
      study_history: messages,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="evidenote-export.json"',
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Could not export study data", error);
    return NextResponse.json(
      { error: "Could not export study data. Check the database setup." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to delete study data." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { confirmation?: unknown }
    | null;
  if (body?.confirmation !== "DELETE_STUDY_DATA") {
    return NextResponse.json(
      { error: "Confirm the study data deletion request." },
      { status: 400 }
    );
  }

  try {
    const deleted = await client.begin(async (transaction) => {
      const notes = await transaction.unsafe<{ id: string }[]>(
        "DELETE FROM study_notes WHERE user_id = $1 RETURNING id",
        [userId]
      );
      const messages = await transaction.unsafe<{ id: string }[]>(
        "DELETE FROM study_messages WHERE user_id = $1 RETURNING id",
        [userId]
      );
      return { notes: notes.length, study_history: messages.length };
    });

    return NextResponse.json({ deleted: true, ...deleted });
  } catch (error) {
    console.error("Could not delete study data", error);
    return NextResponse.json(
      { error: "Could not delete study data. Try again." },
      { status: 500 }
    );
  }
}
