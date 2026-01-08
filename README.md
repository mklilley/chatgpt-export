# ChatGPT Export Browser Bookmarklet (Fork)

The ChatGPT Export bookmarklet is a convenient tool that allows you to effortlessly export conversations with ChatGPT as markdown files. With this bookmarklet, you can capture and save your ChatGPT conversations in a readable format for easy reference and sharing.

This repository is a fork of the original project by Ramiro Gómez. The original work is here for credit and historical context: https://github.com/yaph/chatgpt-export (upstream). This fork modifies the export behavior and build output to match my workflow.

## Installation

This fork doesn't use the upstream bookmarklet page. Use the prebuilt file in this repo or build it locally (instructions below).

## Prebuilt bookmarklet

The repo includes a prebuilt bookmarklet at `dist/gpt2md.bookmarklet.js` so you can copy it without building locally. Open the file on GitHub, click the **Raw** button, and copy the contents into a new bookmark's URL field.

## Local install & build

Prerequisites: Node.js (LTS) and npm.

1. Clone the repo and install dependencies:
   - `npm install`
2. Build the bookmarklet bundle:
   - `npm run build`

The build step bundles `gpt2md.js` and writes the bookmarklet output to `dist/gpt2md.bookmarklet.js`. Copy the contents of that file into a new browser bookmark URL (or replace the URL of an existing bookmarklet) to run it.

## How it works

When the bookmarklet is clicked on a ChatGPT conversation page:

- The page `document.body` is cloned so the live page isn't modified.
- Unwanted UI elements are removed from the clone (headers around code blocks, prompt/response numbering, footer).
- Prompt and response content is converted from HTML to Markdown using Turndown (with GFM table support), preserving code blocks.
- KaTeX math is converted to Markdown-friendly delimiters:
  - Inline math uses `$...$`
  - Display math uses `$$` on their own lines, with blank lines before and after
- You will be prompted to either:
  - Copy the Markdown to the clipboard, or
  - Download a `.md` file named using `document.title` (fallback if clipboard copy fails).

### Output format

- The document starts with `# <conversation title>`.
- Each message is wrapped in a top-level heading:
  - `# PROMPT n`
  - `# RESPONSE n`
- To keep the table of contents stable, any message-level H1 headings are demoted to H2 before conversion (so in-message `#` becomes `##`).

### Formatting choices

This fork currently emits ATX headings (`#`) and uses `-` for list bullets. You can tweak the output by changing the Turndown options in `gpt2md.js`.
