import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/server/supabase";
import { createDocument } from "@/lib/server/documents";
import { checkImportFile, LIMITS, markdownToDoc, textToDoc } from "@/lib/core/doc";

/** .txt or .md (max 1 MB) becomes a new document owned by the uploader. Same checks as the client. */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  if (Number(req.headers.get("content-length") ?? 0) > LIMITS.importBytes + 64 * 1024) {
    return fail(400, "too_large", "The limit is 1 MB.");
  }
  let file: File | null = null;
  try {
    const v = (await req.formData()).get("file");
    file = v instanceof File ? v : null;
  } catch {
    return fail(400, "invalid_upload", "Couldn't read the upload.");
  }
  if (!file) return fail(400, "no_file", "Choose a file to import.");
  const check = checkImportFile(file.name, file.size);
  if (!check.ok) return fail(400, "invalid_file", check.message);

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return fail(400, "not_text", `"${file.name}" isn't readable as UTF-8 text.`);
  }
  if (text.includes("\u0000")) return fail(400, "not_text", `"${file.name}" looks like a binary file.`);

  try {
    const content = check.kind === "md" ? markdownToDoc(text) : textToDoc(text);
    const id = await createDocument(auth.sb, auth.user.id, check.title, content);
    return NextResponse.json({ id, title: check.title }, { status: 201 });
  } catch {
    return fail(500, "import_failed", "Couldn't import this file. Try again.");
  }
}
