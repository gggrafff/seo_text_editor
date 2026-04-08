# SEO Keyword Analyzer

**Live:** https://gggrafff.github.io/seo_text_editor/

A real-time SEO content optimization tool for analyzing and optimizing written content for keyword performance. Provides keyword occurrence tracking, content quality assessment, and word frequency analysis — all running client-side in the browser.

## Features

- **Rich Text Editor** — Quill-based editor with custom keyword highlighting (main keywords in blue, extra in purple) and invisible character detection
- **Keyword Occurrence Tracking** — Real-time counting with Unicode-aware regex matching, word boundary detection, and support for multi-language keywords (including Cyrillic)
- **Quality Checklist** — 10-rule traffic-light system evaluating content length, keyword density, stop words, list formatting, emoji spacing, and invisible characters
- **Word Frequency Analysis** — Top 50 most frequent words with overuse warnings (>3% threshold)
- **Auto-persistence** — Content and keywords saved to localStorage automatically

## Quick Start

No build step required. Open `index.html` directly or serve with any static file server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Quality Checklist Rules

| # | Rule | Green | Yellow |
|---|------|-------|--------|
| 1 | Keywords count | ≥15 | ≥10 |
| 2 | Content length (chars) | 4300–5000 | outside range |
| 3 | Total keyword occurrences | 28–40 | outside range |
| 4 | Main keyword occurrences | 14–20 | outside range |
| 5 | First main keyword occurrences | 7–10 | outside range |
| 6 | Extra keyword occurrences | 14–20 | outside range |
| 7 | No stop words | none found | — |
| 8 | Formatted lists | ≥2 | — |
| 9 | Emoji spacing | proper gaps | — |
| 10 | Invisible characters | none found | — |

## Tech Stack

- Vanilla HTML/CSS/JavaScript (no frameworks)
- [Quill](https://quilljs.com/) rich text editor (v1.3.6 via CDN)
- Dark theme with CSS custom properties

## Project Structure

```
index.html   — App markup and layout
script.js    — Core logic (analysis, highlighting, persistence)
style.css    — Styling and responsive layout
test.js      — Whitespace normalization tests
test2.js     — Unicode/multilingual keyword tests
```

## Tests

```bash
node test.js
node test2.js
```

## Browser Requirements

Modern browser with ES6+, Unicode regex property support (`\p{L}`), CSS Grid, and localStorage. Chrome 90+, Firefox 78+, Safari 14+, Edge 90+.

## License

Private.
