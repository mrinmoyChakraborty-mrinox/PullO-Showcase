import fs from "fs";
import path from "path";

const SITE_URL = "https://docs.pullo.co";

interface RssEntry {
  title: string;
  date: string;
  tags: string[];
  body: string;
  slug: string;
}

function parseFrontmatter(source: string) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return null;

  const raw = match[1];
  const body = match[2].trim();
  const frontmatter: Record<string, unknown> = {};

  for (const line of raw.split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      let value: string = kv[2].trim();
      if (value === "true") { frontmatter[kv[1]] = true; continue; }
      if (value === "false") { frontmatter[kv[1]] = false; continue; }
      if (/^\[.*\]$/.test(value)) {
        frontmatter[kv[1]] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
        continue;
      }
      frontmatter[kv[1]] = value.replace(/^["']|["']$/g, "");
    }
  }

  return { frontmatter, body };
}

function loadRssEntries(): RssEntry[] {
  const dir = path.join(process.cwd(), "content", "changelog");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort().reverse();
  const entries: RssEntry[] = [];

  for (const file of files) {
    const source = fs.readFileSync(path.join(dir, file), "utf-8");
    const parsed = parseFrontmatter(source);
    if (!parsed) continue;
    const { frontmatter, body } = parsed;
    const slug = file.replace(/\.mdx$/, "");
    entries.push({
      title: (frontmatter.title as string) || slug,
      date: (frontmatter.date as string) || "",
      tags: (frontmatter.tags as string[]) || [],
      body,
      slug,
    });
  }

  return entries;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const entries = loadRssEntries();

  const items = entries
    .map(
      (entry) => `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${SITE_URL}/changelog</link>
      <guid isPermaLink="false">${escapeXml(entry.slug)}</guid>
      <pubDate>${new Date(entry.date + "T00:00:00Z").toUTCString()}</pubDate>
      <description>${escapeXml(entry.body.slice(0, 300))}</description>
      ${entry.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("\n      ")}
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PullO Changelog</title>
    <link>${SITE_URL}/changelog</link>
    <description>Release notes for PullO — extension, backend, and dashboard updates.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/changelog/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
