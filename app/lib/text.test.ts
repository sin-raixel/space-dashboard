import { describe, expect, it } from "vitest";
import { htmlToText } from "./text";

describe("htmlToText", () => {
  it("removes tags and links but keeps the words", () => {
    expect(htmlToText('<a href="https://x.test">The sky glows</a> pink.')).toBe("The sky glows pink.");
  });

  it("drops the leading 'Explanation:' label", () => {
    expect(htmlToText("<strong>Explanation:</strong> A nebula.")).toBe("A nebula.");
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToText("Tom &amp; Jerry&#39;s &quot;show&quot; &#x2014; ok")).toBe('Tom & Jerry\'s "show" \u2014 ok');
  });

  it("does not turn encoded markup back into tags", () => {
    expect(htmlToText("&lt;script&gt;alert(1)&lt;/script&gt;")).toBe("<script>alert(1)</script>");
  });

  it("turns paragraphs and line breaks into newlines", () => {
    expect(htmlToText("<p>One</p><p>Two<br>Three</p>")).toBe("One\n\nTwo\nThree");
  });

  it("leaves unknown entities alone", () => {
    expect(htmlToText("a &madeup; b")).toBe("a &madeup; b");
  });
});