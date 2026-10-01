import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Headlines are 500, never 600 or 700 (docs/design.md, "Type"). The PDF preview
// in review-export.tsx is a paper document and keeps its own weights.
const root = new URL("../src", import.meta.url).pathname;
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".tsx") ? [path] : [];
  });

describe("type roles", () => {
  it("no component sets a heading bolder than 500", () => {
    const offenders = walk(root)
      .filter((path) => !path.endsWith("review-export.tsx"))
      .filter((path) =>
        /\bfont-(semibold|bold|extrabold|black)\b/.test(readFileSync(path, "utf8")),
      );
    expect(offenders).toEqual([]);
  });
});
