// Browser test of the main user journey at desktop and phone sizes (real app, real database).
// Usage: BASE=http://localhost:3000 npm run test:ui   (screenshots go to ./.ui-shots, git-ignored)
import { chromium, type Page } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = ".ui-shots";
mkdirSync(OUT, { recursive: true });
let failures = 0;
const check = (name: string, ok: boolean) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); if (!ok) failures++; };
const shot = (p: Page, n: string) => p.screenshot({ path: `${OUT}/${n}.png` });

async function main() {
  const browser = await chromium.launch();
  const errors: string[] = [];

  // ---------- desktop ----------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE + "/");
  check("signed-out visit lands on /login", page.url().endsWith("/login"));
  await shot(page, "01-login");
  await page.fill("#email", "maya@docspace.dev");
  await page.fill("#pw", "wrong-password");
  await page.click("button[type=submit]");
  await page.locator(".alert.danger").waitFor();
  check("wrong password shows the inline alert", (await page.locator(".alert.danger").textContent())?.includes("don't match") ?? false);
  await page.getByRole("button", { name: /Maya Chen/ }).click();
  await page.waitForURL(BASE + "/");
  await page.getByRole("heading", { name: "My documents" }).waitFor();
  await page.locator(".tr.row").first().waitFor();
  check("dashboard lists Maya's seeded documents", (await page.locator(".tr.row").count()) >= 3);
  await shot(page, "04-dashboard");

  await page.locator("input[type=search]").fill("zzz-no-match");
  check("search with no match shows the empty state", await page.getByText("No documents match").isVisible());
  await page.locator("input[type=search]").fill("");

  await page.getByRole("link", { name: /Shared with me/ }).click();
  await page.getByRole("heading", { name: "Shared with me" }).waitFor();
  check("shared list shows documents owned by others", await page.getByText("Engineering Team Meeting Notes").isVisible());
  await shot(page, "09-shared");
  await page.getByRole("link", { name: /My documents/ }).click();

  // create, title, format, autosave, reload
  await page.locator(".sidebar").getByRole("button", { name: "New document" }).click();
  await page.waitForURL(/\/doc\//);
  const docUrl = page.url().split("?")[0];
  await page.locator(".title-in").fill("UI test document");
  await page.locator(".tiptap").click();
  await page.keyboard.type("Heading here");
  await page.getByRole("button", { name: /Text style/ }).click();
  await page.getByRole("menuitem", { name: /Heading 1/ }).click();
  await page.waitForFunction(() => document.activeElement?.classList.contains("tiptap"));
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await page.keyboard.type("bold words");
  check("bold button shows its active state", (await page.getByRole("button", { name: "Bold", exact: true }).getAttribute("aria-pressed")) === "true");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Bulleted list" }).click();
  await page.keyboard.type("first item");
  await page.getByText("Saved", { exact: true }).waitFor({ timeout: 10000 });
  check("autosave reaches Saved", true);
  await shot(page, "12-editor");
  await page.reload();
  await page.locator(".tiptap h1").waitFor();
  check("after reload: heading kept", (await page.locator(".tiptap h1").textContent()) === "Heading here");
  check("after reload: bold kept", (await page.locator(".tiptap strong").textContent()) === "bold words");
  check("after reload: list kept", (await page.locator(".tiptap ul li").textContent()) === "first item");
  check("after reload: title kept", (await page.locator(".title-in").inputValue()) === "UI test document");

  // share dialog
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByPlaceholder("Add people by email").fill("nobody@docspace.dev");
  await page.getByRole("dialog").getByRole("button", { name: "Share", exact: true }).click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  check("unknown email shows the spec message", (await page.getByRole("dialog").getByRole("alert").textContent())?.includes("No DocSpace account uses") ?? false);
  await page.getByPlaceholder("Add people by email").fill("daniel@docspace.dev");
  await page.getByRole("dialog").getByRole("button", { name: "Share", exact: true }).click();
  await page.getByText("Daniel Okafor can now edit this document.").waitFor();
  check("sharing with Daniel succeeds and lists him", await page.getByRole("dialog").getByText("daniel@docspace.dev").isVisible());
  await shot(page, "23-share-success");
  await page.keyboard.press("Escape");

  // import dialog validation
  await page.goto(BASE + "/");
  await page.locator(".page-head").getByRole("button", { name: "Import" }).click();
  await page.locator("input[type=file]").setInputFiles({ name: "budget.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
  check("import rejects a .pdf in the dialog", await page.getByText("isn't a .txt or .md file").isVisible());
  await page.locator("input[type=file]").setInputFiles({ name: "Imported notes.md", mimeType: "text/markdown", buffer: Buffer.from("# Notes\n\n- one\n- **two**") });
  await shot(page, "28-import-selected");
  await page.getByRole("dialog").getByRole("button", { name: "Import" }).click();
  await page.waitForURL(/\/doc\//);
  await page.locator(".tiptap h1").waitFor();
  check("imported markdown opens as an editable document", (await page.locator(".title-in").inputValue()) === "Imported notes");
  const importedUrl = page.url();

  // Daniel's view: shared document, presence of the owner pill
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE + "/login");
  await p2.getByRole("button", { name: /Daniel Okafor/ }).click();
  await p2.waitForURL(BASE + "/");
  await p2.goto(docUrl);
  await p2.locator(".tiptap h1").waitFor();
  check("Daniel opens the shared document and sees 'Owned by Maya Chen'", await p2.getByText("Owned by Maya Chen").isVisible());
  await page.goto(docUrl);
  await page.locator(".presence .av").first().waitFor({ timeout: 8000 }).catch(() => {});
  check("presence shows the other person viewing", (await page.locator(".presence .av").count()) >= 1);
  await shot(page, "25-presence");

  // ---------- phone ----------
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState() });
  const pp = await phone.newPage();
  await pp.goto(BASE + "/");
  await pp.locator(".tr.row").first().waitFor();
  check("phone: no horizontal page scroll on the dashboard", await pp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await shot(pp, "35-mobile-dashboard");
  await pp.getByRole("button", { name: "Open navigation" }).click();
  check("phone: navigation drawer opens", await pp.locator(".app.nav-open").isVisible());
  await pp.locator(".scrim").click({ position: { x: 350, y: 400 } });
  await pp.goto(docUrl);
  await pp.locator(".tiptap h1").waitFor();
  check("phone: no horizontal page scroll in the editor", await pp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await shot(pp, "36-mobile-editor");

  // cleanup
  for (const u of [docUrl, importedUrl]) {
    const id = u.split("/doc/")[1];
    await page.evaluate((i) => fetch(`/api/documents/${i}`, { method: "DELETE" }), id);
  }
  check("no uncaught page errors", errors.length === 0);
  if (errors.length) console.log(errors);
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll UI checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
