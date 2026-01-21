import { describe, it, expect } from "vitest";
import { escapeSubject } from "./emailUtils";

describe("escapeSubject", () => {
  it("returns plain text unchanged", () => {
    expect(escapeSubject("John Doe")).toBe("John Doe");
    expect(escapeSubject("Contract Agreement")).toBe("Contract Agreement");
  });

  it("escapes HTML special characters", () => {
    expect(escapeSubject("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(escapeSubject("Smith & Associates")).toBe("Smith &amp; Associates");
  });

  it("escapes double quotes", () => {
    expect(escapeSubject('Document "Important"')).toBe(
      "Document &quot;Important&quot;"
    );
  });

  it("escapes single quotes", () => {
    expect(escapeSubject("O'Brien")).toBe("O&#039;Brien");
  });

  it("escapes angle brackets", () => {
    expect(escapeSubject("Test <Value>")).toBe("Test &lt;Value&gt;");
  });

  it("removes newlines to prevent header injection", () => {
    expect(escapeSubject("Line1\nLine2")).toBe("Line1 Line2");
    expect(escapeSubject("Line1\rLine2")).toBe("Line1 Line2");
    expect(escapeSubject("Line1\r\nLine2")).toBe("Line1 Line2");
  });

  it("handles multiple escape scenarios", () => {
    expect(escapeSubject("<Test> & 'Quotes'\nNewline")).toBe(
      "&lt;Test&gt; &amp; &#039;Quotes&#039; Newline"
    );
  });

  it("handles empty string", () => {
    expect(escapeSubject("")).toBe("");
  });

  it("handles unicode characters", () => {
    expect(escapeSubject("Café résumé 日本語")).toBe("Café résumé 日本語");
  });
});
