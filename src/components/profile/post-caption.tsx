import Link from "next/link";
import type { ReactNode } from "react";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Linkuje:
 * - @username
 * - handlery z listy oznaczeń
 * - tokeny wyglądające na username (cyfra lub _ / .)
 */
export function linkifyPostText(
  content: string,
  taggedUsernames: string[] = [],
): ReactNode[] {
  const text = content.trim();
  if (!text) return [];

  const known = [
    ...new Set(
      taggedUsernames
        .map((u) => u.trim().toLowerCase())
        .filter((u) => u.length >= 3),
    ),
  ];

  const mentionPart = "@[a-z0-9](?:[a-z0-9._]*[a-z0-9])?";
  const knownPart =
    known.length > 0 ? known.map(escapeRegExp).join("|") : null;
  // np. buczu999_2 — ma cyfrę albo separator
  const heuristicPart =
    "[a-z0-9]+(?:[._][a-z0-9]+)+|[a-z][a-z0-9._]*\\d[a-z0-9._]*";

  const pattern = knownPart
    ? new RegExp(
        `(${mentionPart})|\\b(${knownPart})\\b|\\b(${heuristicPart})\\b`,
        "gi",
      )
    : new RegExp(`(${mentionPart})|\\b(${heuristicPart})\\b`, "gi");

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const raw = match[0];
    const handle = raw.replace(/^@/, "").toLowerCase();
    nodes.push(
      <Link
        key={`m-${key++}`}
        href={`/profile/${encodeURIComponent(handle)}`}
        className="font-semibold text-violet-300 hover:underline"
      >
        @{handle}
      </Link>,
    );
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
