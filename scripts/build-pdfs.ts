// Renders the architecture and AI workflow notes to PDF (headless Chromium), in the app's typeface.
// Usage: npx tsx scripts/build-pdfs.ts <outDir>
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { marked } from "marked";
import { chromium } from "playwright";

const out = resolve(process.argv[2] ?? "submission");
mkdirSync(out, { recursive: true });
const font = (f: string) => `data:font/woff2;base64,${readFileSync(`public/fonts/${f}`).toString("base64")}`;

const css = `
@font-face{font-family:Inter;src:url(${font("Inter-Variable.woff2")});font-weight:100 900}
@font-face{font-family:"Inter Tight";src:url(${font("InterTight-Variable.woff2")});font-weight:100 900}
@page{size:A4;margin:18mm 18mm 20mm}
body{font:10.5pt/1.55 Inter,sans-serif;color:#1f1f23}
h1{font:600 20pt/1.2 "Inter Tight",sans-serif;letter-spacing:-.02em;margin:0 0 4pt}
h2{font:600 12.5pt/1.3 "Inter Tight",sans-serif;margin:16pt 0 5pt;color:#18181b}
p{margin:0 0 7pt}
ul,ol{margin:0 0 8pt;padding-left:16pt}li{margin:2pt 0}
table{border-collapse:collapse;width:100%;margin:4pt 0 10pt;font-size:9.5pt;page-break-inside:auto}
tr{page-break-inside:avoid}
th,td{border:1px solid #e6e6e3;padding:4pt 6pt;text-align:left;vertical-align:top}
th{background:#f7f7f5;font-weight:600}
code{font:9pt ui-monospace,Consolas,monospace;background:#f2f2f0;padding:0 3px;border-radius:3px}
pre{background:#f7f7f5;border:1px solid #e6e6e3;border-radius:6px;padding:8pt;font-size:8.5pt;line-height:1.35;white-space:pre;overflow:hidden}
pre code{background:none;padding:0}
a{color:#3451d1;text-decoration:none}
.foot{margin-top:14pt;color:#6f6f76;font-size:8.5pt;border-top:1px solid #e6e6e3;padding-top:6pt}
`;

const docs = [
  { src: "docs/ARCHITECTURE.md", pdf: "Architecture.pdf" },
  { src: "docs/AI_WORKFLOW.md", pdf: "AI_Workflow.pdf" },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const d of docs) {
    const body = await marked.parse(readFileSync(d.src, "utf8"));
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}
      <div class="foot">DocSpace · Ajaia AI-Native Full Stack Developer assessment · https://docspace-ajaia.netlify.app</div></body></html>`, { waitUntil: "load" });
    await page.evaluateHandle("document.fonts.ready");
    await page.pdf({ path: resolve(out, d.pdf), format: "A4", printBackground: true });
    console.log("wrote", d.pdf);
  }
  await browser.close();
})();
