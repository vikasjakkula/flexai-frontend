export const PAGE_EXTRACTION_PROMPT = `You are extracting content from a scanned page of handwritten JEE/EAMCET preparation notes.

Your job: read the image of the page and convert it into clean, structured chunks suitable for AI retrieval.

EXTRACT THE FOLLOWING TYPES OF CONTENT:
1. **formula** — Any equation, identity, or mathematical/physical/chemical formula
2. **theorem** — Named theorems, laws, principles (e.g., "Newton's Second Law", "Binomial Theorem")
3. **example** — Worked example problems with solutions
4. **theory** — Conceptual explanations, definitions, properties

OUTPUT FORMAT — STRICT JSON (an array of chunks):
{
  "page_summary": "1-line description of what this page covers",
  "chunks": [
    {
      "type": "formula" | "theorem" | "example" | "theory",
      "title": "short title (e.g., 'General term in binomial expansion')",
      "content": "the actual content in clean LaTeX",
      "topic_tags": ["tag1", "tag2"]
    }
  ]
}

RULES:
- Convert ALL handwritten math to proper LaTeX (use \\frac, \\sqrt, ^{}, _{}, \\int, \\sum, etc.)
- For formulas: wrap the formula in \\boxed{} and include a brief context line
- For examples: include the FULL question + FULL solution in LaTeX
- IGNORE: page numbers, doodles, crossed-out text, irrelevant scribbles
- If a page is mostly blank or unreadable, return: {"page_summary": "blank or unreadable", "chunks": []}
- Each chunk should be SELF-CONTAINED — someone should be able to understand it without seeing other chunks
- Aim for 2-8 chunks per page (more if it's a dense page, less if it's sparse)
- Do not invent content. Only extract what's actually on the page.

CRITICAL JSON RULE:
- All backslashes in LaTeX MUST be double-escaped in the JSON string.
- Example: "\\frac{a}{b}" not "\frac{a}{b}"
- Example: "x^2 + y^2 = r^2" or "\\sqrt{x^2+y^2}" — use double backslashes for ALL LaTeX commands
- Test your JSON mentally before responding. If you're unsure, escape it.

Return ONLY valid JSON. No markdown, no preamble.`;