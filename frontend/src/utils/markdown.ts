/**
 * Simple markdown to HTML converter
 * Handles basic markdown syntax: headings, bold, italic, strikethrough, lists, and horizontal rules
 * 
 * Note: This is a lightweight parser for the basic formatting features used in the rich text editor.
 * For more complex markdown, consider using a library like marked or remark.
 */

/**
 * Converts markdown text to HTML
 * @param markdown - The markdown string to convert
 * @returns HTML string
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Normalize line endings (convert \r\n to \n)
  html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Escape HTML entities first to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Convert headings (h1-h6)
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Convert horizontal rules
  html = html.replace(/^---$/gm, '<hr />');
  html = html.replace(/^\*\*\*$/gm, '<hr />');
  html = html.replace(/^___$/gm, '<hr />');
  
  // Convert bold (must be before italic to handle ***)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Convert strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  
  // Convert unordered lists
  // Match consecutive lines starting with - or *
  html = html.replace(/^(?:[*-] .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^[*-] /, '');
      return `<li>${content}</li>`;
    }).join('');
    return `<ul>${items}</ul>`;
  });
  
  // Convert ordered lists
  // Match consecutive lines starting with numbers
  html = html.replace(/^(?:\d+\. .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^\d+\. /, '');
      return `<li>${content}</li>`;
    }).join('');
    return `<ol>${items}</ol>`;
  });
  
  // Convert line breaks to paragraphs
  // Split by double newlines for paragraphs
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    // Don't wrap if already wrapped in block elements
    if (block.match(/^<(h[1-6]|ul|ol|hr|p)/)) {
      return block;
    }
    // Convert single newlines to <br> within paragraphs
    const withBreaks = block.replace(/\n/g, '<br />');
    return `<p>${withBreaks}</p>`;
  }).join('');
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  
  return html;
}

/**
 * Checks if a string contains markdown formatting
 * @param text - The text to check
 * @returns boolean indicating if the text appears to contain markdown
 */
export function containsMarkdown(text: string): boolean {
  if (!text) return false;
  
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6} /m,           // Headings
    /\*\*.+?\*\*/,         // Bold
    /\*.+?\*/,             // Italic
    /~~.+?~~/,             // Strikethrough
    /^[*-] /m,             // Unordered list
    /^\d+\. /m,            // Ordered list
    /^---$/m,              // Horizontal rule
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}
