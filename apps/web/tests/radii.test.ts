import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// Every corner comes off the radius ladder (docs/design.md, "Radii"). A pill is
// the one shape that may state its own radius.
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

describe("radius ladder", () => {
  it("globals.css states no radius in px outside a pill", () => {
    const literal = css.match(/border-radius:\s*[0-9.]+(px|rem)/g) ?? [];
    expect(literal).toEqual(["border-radius: 100px"]);
  });
});
