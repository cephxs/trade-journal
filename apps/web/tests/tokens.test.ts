import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// Every color role in globals.css, both themes, against the surface it sits on.
// Text roles need WCAG AA 4.5:1; marks and UI fills need 3:1.
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const block = (selector: string): Record<string, string> => {
  const body = css.match(new RegExp(`${selector.replace(".", "\\.")} \\{([^}]*)\\}`))?.[1] ?? "";
  return Object.fromEntries(
    [...body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1]!, m[2]!]),
  );
};
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const hi = Math.max(lum(a), lum(b));
  const lo = Math.min(lum(a), lum(b));
  return (hi + 0.05) / (lo + 0.05);
};

const text: [string, string][] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["primary-foreground", "primary"],
  ["destructive-foreground", "destructive"],
  ["brand", "background"],
  ["profit", "card"],
  ["loss", "card"],
];
const marks: [string, string][] = [
  ["ring", "background"],
  ["destructive", "card"],
  ["profit-fill", "card"],
  ["rating", "card"],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((i): [string, string] => [`series-${i}`, "viz-surface"]),
];

describe.each([":root", ".dark"])("%s palette", (theme) => {
  const t = block(theme);
  it.each(text)("%s reads as text on %s", (fg, bg) => {
    expect(contrast(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(marks)("%s reads as a mark on %s", (fg, bg) => {
    expect(contrast(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(3);
  });
});
