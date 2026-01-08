const TurndownService = require('turndown');
const tables = require('turndown-plugin-gfm').tables;
const ts = new TurndownService({
    'hr': '___________',
    'preformattedCode': true,
    'headingStyle': 'atx',
    'bulletListMarker': '-',
    'codeBlockStyle': 'fenced'
 });
ts.use(tables);

const extractLatex = (node) => {
    if (!node || !node.querySelector) return '';
    let annotation = node.querySelector('annotation[encoding="application/x-tex"]');
    if (!annotation) annotation = node.querySelector('annotation');
    if (annotation && annotation.textContent) return annotation.textContent.trim();
    if (typeof node.getAttribute === 'function') {
        const dataLatex = node.getAttribute('data-latex') || node.getAttribute('data-tex');
        if (dataLatex) return dataLatex.trim();
        const aria = node.getAttribute('aria-label');
        if (aria) return aria.trim();
    }
    return node.textContent ? node.textContent.trim() : '';
};

const renameTag = (node, tagName) => {
    if (!node || !node.parentNode) return;
    const replacement = node.ownerDocument.createElement(tagName);
    Array.from(node.attributes).forEach((attr) => replacement.setAttribute(attr.name, attr.value));
    while (node.firstChild) replacement.appendChild(node.firstChild);
    node.parentNode.replaceChild(replacement, node);
};

ts.addRule('math', {
    filter: function (node) {
        if (!node || node.nodeType !== 1 || !node.classList) return false;
        if (node.closest && node.closest('pre,code')) return false;
        if (node.classList.contains('katex-display')) return true;
        if (node.classList.contains('katex')) {
            if (node.closest && node.closest('.katex-display')) return false;
            return true;
        }
        return false;
    },
    replacement: function (content, node) {
        const latex = extractLatex(node);
        if (!latex) return '';
        if (node.classList && node.classList.contains('katex-display')) {
            return `\n\n$$\n${latex}\n$$\n\n`;
        }
        return `$${latex}$`;
    }
});

// Clone to not modify the actual `document.body` in the code that follows
const body = document.body.cloneNode(true);

// Remove code box headers
body.querySelectorAll('pre .text-xs').forEach(n => n.parentNode?.removeChild(n));

// Remove prompt/response numbers
body.querySelectorAll('div .text-xs.gap-1').forEach(n => n.parentNode?.removeChild(n));

// Remove footer
body.querySelector('#thread-bottom-container').remove()

// properly format code blocks
body.querySelectorAll('.text-message pre').forEach((n) => {
  n.innerHTML = n.querySelector('code').outerHTML;
});

// Ensure chat headings don't outrank PROMPT/RESPONSE headings in the TOC:
// demote any message-level H1 to H2 before converting to Markdown.
body.querySelectorAll('.text-message h1').forEach((n) => renameTag(n, 'h2'));

// Iterate through main text containers and create text to export
let text = `# ${document.title}\n\n`;
body.querySelectorAll('.text-message').forEach((n, i) => {
    const num = Math.trunc(i / 2) + 1;
    const prose = n.querySelector('.prose');
    if (prose) {
        // Only convert response markup to markdown
        text += `# RESPONSE ${num}\n\n${ts.turndown(prose.innerHTML)}\n\n`;
    } else {
        // Convert prompt HTML to markdown to preserve code fences/math
        // Original (kept for easy revert):
        // text += `# PROMPT ${num}\n\n${n.querySelector('div').innerText}\n\n`;
        const prompt = n.querySelector('.whitespace-pre-wrap') || n.querySelector('div');
        const promptHtml = prompt ? prompt.innerHTML : n.innerHTML;
        text += `# PROMPT ${num}\n\n${ts.turndown(promptHtml)}\n\n`;
    }
});

const downloadMarkdown = () => {
    const a = document.createElement('a');
    a.download = `${document.title}.md`;
    a.href = URL.createObjectURL(new Blob([text]));
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
};

const copyMarkdownToClipboard = () => {
    if (!navigator.clipboard?.writeText) {
        return Promise.reject(new Error('Clipboard API not available'));
    }
    return navigator.clipboard.writeText(text);
};

const copyToClipboard = confirm(
    'Export Markdown\n\nOK: copy to clipboard\nCancel: download .md file'
);

if (copyToClipboard) {
    copyMarkdownToClipboard()
        .then(() => {
            alert('Copied Markdown to clipboard.');
        })
        .catch((err) => {
            console.error(err);
            downloadMarkdown();
            alert('Clipboard copy failed. Downloaded a .md file instead.');
        });
} else {
    downloadMarkdown();
}
