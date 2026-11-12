import { describe, expect, it } from "vitest";
import {
  checkImportFile, docToMarkdown, isDocJSON, isValidEmail, markdownToDoc, normalizeTitle,
  parseInline, shareOutcome, textToDoc, timeAgo,
} from "../src/lib/core/doc";

describe("text import", () => {
  it("turns each line into a paragraph and collapses blank runs", () => {
    const d = textToDoc("Line one\r\nLine two\n\n\n\nLine three\n\n");
    expect(d.content.map((b) => (b.type === "paragraph" ? b.content?.[0]?.text ?? "" : "?"))).toEqual(["Line one", "Line two", "", "Line three"]);
  });
  it("never produces an empty document", () => {
    expect(textToDoc("")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });
  it("strips a byte-order mark", () => {
    expect(textToDoc("﻿Hello").content[0]).toEqual({ type: "paragraph", content: [{ type: "text", text: "Hello" }] });
  });
});

describe("markdown import and export", () => {
  const md = "# Roadmap\n\nWe ship **fast** and *carefully*, with <u>tests</u>.\n\n## Goals\n\n1. Onboarding\n2. Sharing\n\n- one\n- two\n";
  it("parses headings, lists and inline marks", () => {
    const d = markdownToDoc(md);
    expect(d.content.map((b) => b.type)).toEqual(["heading", "paragraph", "heading", "orderedList", "bulletList"]);
    expect(parseInline("a **b** c")).toEqual([
      { type: "text", text: "a " }, { type: "text", text: "b", marks: [{ type: "bold" }] }, { type: "text", text: " c" },
    ]);
  });
  it("round-trips the supported subset without loss", () => {
    expect(docToMarkdown(markdownToDoc(md))).toBe(md);
  });
  it("caps heading depth at the editor's three levels", () => {
    const b = markdownToDoc("#### Deep").content[0];
    expect(b).toMatchObject({ type: "heading", attrs: { level: 3 } });
  });
});

describe("validation", () => {
  it("normalizes titles", () => {
    expect(normalizeTitle("  Q4   plan ")).toBe("Q4 plan");
    expect(normalizeTitle("   ")).toBe("Untitled document");
    expect(normalizeTitle(42)).toBe("Untitled document");
    expect(normalizeTitle("x".repeat(300))).toHaveLength(200);
  });
  it("checks emails", () => {
    expect(isValidEmail("maya@docspace.dev")).toBe(true);
    expect(isValidEmail("maya@docspace")).toBe(false);
    expect(isValidEmail("not an email")).toBe(false);
  });
  it("accepts only .txt/.md up to 1 MB", () => {
    expect(checkImportFile("notes.TXT", 10)).toEqual({ ok: true, kind: "txt", title: "notes" });
    expect(checkImportFile("readme.md", 10)).toMatchObject({ ok: true, kind: "md", title: "readme" });
    expect(checkImportFile("budget.pdf", 10)).toMatchObject({ ok: false });
    expect(checkImportFile("big.txt", 1.4 * 1024 * 1024)).toEqual({ ok: false, message: '"big.txt" is 1.4 MB. The limit is 1 MB.' });
    expect(checkImportFile("empty.txt", 0)).toMatchObject({ ok: false });
  });
  it("rejects content that is not editor JSON", () => {
    expect(isDocJSON({ type: "doc", content: [] })).toBe(true);
    expect(isDocJSON({ type: "doc" })).toBe(false);
    expect(isDocJSON("<p>hi</p>")).toBe(false);
  });
});

describe("share outcomes map to the spec copy and HTTP codes", () => {
  it("covers every status", () => {
    expect(shareOutcome("ok", "d@x.dev", "Daniel")).toEqual({ http: 200, message: "Daniel can now edit this document." });
    expect(shareOutcome("ok", "d@x.dev", "Daniel", "viewer").message).toBe("Daniel can now view this document.");
    expect(shareOutcome("no_user", "z@x.dev").http).toBe(404);
    expect(shareOutcome("is_owner", "m@x.dev").http).toBe(409);
    expect(shareOutcome("already_shared", "d@x.dev", "Daniel")).toEqual({ http: 409, message: "Daniel already has access." });
    expect(shareOutcome("not_owner", "d@x.dev").http).toBe(403);
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-11-12T12:00:00Z");
  it("formats relative times", () => {
    expect(timeAgo("2026-11-12T11:59:30Z", now)).toBe("Just now");
    expect(timeAgo("2026-11-12T11:48:00Z", now)).toBe("12 min ago");
    expect(timeAgo("2026-11-12T09:00:00Z", now)).toBe("3 h ago");
    expect(timeAgo("2026-11-11T08:00:00Z", now)).toBe("Yesterday");
  });
});
