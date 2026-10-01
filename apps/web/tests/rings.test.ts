import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Rings are inset box-shadows (docs/design.md, "Rings"). Two things a diff hides:
// a ring utility and a drop shadow on one element is a cascade race the shadow
// loses, and a hex colour in a stylesheet is a token that escaped.
const src = new URL("../src", import.meta.url).pathname;
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".tsx") ? [path] : [];
  });

describe("rings", () => {
  it("no element pairs a ring utility with a drop shadow", () => {
    const offenders = walk(src).flatMap((path) =>
      readFileSync(path, "utf8")
        .split("\n")
        .filter(
          (line) =>
            /\binset-(outline|divider)/.test(line) && /\bshadow-(xs|sm|md|lg|xl|2xl)\b/.test(line),
        )
        .map((line) => `${path}: ${line.trim()}`),
    );
    expect(offenders).toEqual([]);
  });
  it("globals.css states colours only in the two token blocks", () => {
    const css = readFileSync(join(src, "app/globals.css"), "utf8");
    const afterTokens = css.slice(css.indexOf("@theme inline"));
    expect(afterTokens.match(/#[0-9a-fA-F]{6}\b/g) ?? []).toEqual([]);
  });
});
