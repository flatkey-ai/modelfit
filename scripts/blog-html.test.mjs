import { describe, expect, test } from "bun:test";
import { normalizeBlogBodyHtml } from "../lib/blog.ts";

describe("blog body heading normalization", () => {
  test("demotes CMS h1 headings while preserving attributes and content", () => {
    const source = '<h1 id="worked-example">Worked example</h1><p>Body</p>';
    const normalized = normalizeBlogBodyHtml(source);

    expect(normalized).toBe('<h2 id="worked-example">Worked example</h2><p>Body</p>');
    expect(normalized).not.toContain("<h1");
  });
});
