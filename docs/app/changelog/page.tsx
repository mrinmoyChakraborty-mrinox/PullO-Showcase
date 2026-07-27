import fs from "fs";
import path from "path";
import { Callout } from "@/components/callout";

interface ChangelogEntry {
  title: string;
  date: string;
  tags: string[];
  body: string;
  slug: string;
}

const TAG_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  extension: {
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.25)",
    text: "#60a5fa",
  },
  backend: {
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.25)",
    text: "#a78bfa",
  },
  dashboard: {
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.25)",
    text: "#4ade80",
  },
  sdk: {
    bg: "rgba(160,160,181,0.12)",
    border: "rgba(160,160,181,0.25)",
    text: "#a0a0b5",
  },
};

const DEFAULT_TAG_COLOR = {
  bg: "rgba(160,160,181,0.12)",
  border: "rgba(160,160,181,0.25)",
  text: "#a0a0b5",
};

function parseFrontmatter(
  source: string
): { frontmatter: Record<string, unknown>; body: string } | null {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return null;

  const raw = match[1];
  const body = match[2].trim();
  const frontmatter: Record<string, unknown> = {};

  for (const line of raw.split("\n")) {
    const kvMatch = line.match(/^(\w+):\s*(.+)$/);
    if (kvMatch) {
      let value: string = kvMatch[2].trim();
      if (value === "true") { frontmatter[kvMatch[1]] = true; continue; }
      if (value === "false") { frontmatter[kvMatch[1]] = false; continue; }
      if (/^\[.*\]$/.test(value)) {
        frontmatter[kvMatch[1]] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
        continue;
      }
      frontmatter[kvMatch[1]] = value.replace(/^["']|["']$/g, "");
    }
  }

  return { frontmatter, body };
}

function loadEntries(): ChangelogEntry[] {
  const dir = path.join(process.cwd(), "content", "changelog");
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .reverse();

  const entries: ChangelogEntry[] = [];

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

function TagBadge({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag.toLowerCase()] || DEFAULT_TAG_COLOR;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.03em",
        padding: "2px 8px",
        borderRadius: "999px",
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        textTransform: "capitalize",
      }}
    >
      {tag}
    </span>
  );
}

function EntryCard({ entry }: { entry: ChangelogEntry }) {
  const dateObj = new Date(entry.date + "T00:00:00");
  const formatted = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const bullets = entry.body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("-"))
    .map((l) => l.replace(/^-\s*/, ""));

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 28px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--color-text-secondary)",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            {formatted}
          </span>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {entry.title}
          </h2>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flexShrink: 0 }}>
          {entry.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {bullets.map((bullet, i) => (
          <li
            key={i}
            style={{
              paddingLeft: "20px",
              position: "relative",
              color: "var(--color-text-secondary)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: "10px",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "var(--color-iris-500)",
                opacity: 0.5,
              }}
            />
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const metadata = {
  title: "Changelog",
  description: "PullO release notes — extension updates, backend changes, and dashboard improvements.",
};

export default function ChangelogPage() {
  const entries = loadEntries();

  return (
    <div>
      <h1>Changelog</h1>

      <Callout variant="info" title="Scope">
        This page tracks significant releases across all PullO components. Bug fixes and minor
        patches are omitted. Subscribe to the{" "}
        <a
          href="https://github.com/mrinmoyChakraborty-mrinox/PullO"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub repository
        </a>{" "}
        to be notified of new releases.
      </Callout>

      {entries.length === 0 && (
        <p style={{ color: "var(--color-text-secondary)", marginTop: "24px" }}>
          No entries yet.
        </p>
      )}

      <div style={{ marginTop: "32px" }}>
        {entries.map((entry) => (
          <EntryCard key={entry.slug} entry={entry} />
        ))}
      </div>
    </div>
  );
}
