/**
 * Simple markdown formatter for chatbot responses
 * Converts common markdown patterns to JSX elements
 */

import React from 'react';

export const formatMarkdown = (text: string): JSX.Element => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines (but add spacing)
    if (!line.trim()) {
      elements.push(<br key={`br-${key++}`} />);
      continue;
    }

    // Horizontal rule (---)
    if (line.trim() === '---') {
      elements.push(
        <hr key={`hr-${key++}`} style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
      );
      continue;
    }

    // Headers (### H3, ## H2, # H1)
    if (line.startsWith('###')) {
      const headerText = formatInlineMarkdown(line.replace(/^###\s*/, ''));
      elements.push(
        <h3 key={`h3-${key++}`} style={{ fontSize: '15px', fontWeight: '600', margin: '12px 0 6px 0', color: '#00684A' }}>
          {headerText}
        </h3>
      );
      continue;
    }
    
    if (line.startsWith('##')) {
      const headerText = formatInlineMarkdown(line.replace(/^##\s*/, ''));
      elements.push(
        <h2 key={`h2-${key++}`} style={{ fontSize: '16px', fontWeight: '600', margin: '12px 0 6px 0', color: '#00684A' }}>
          {headerText}
        </h2>
      );
      continue;
    }
    
    if (line.startsWith('#')) {
      const headerText = formatInlineMarkdown(line.replace(/^#\s*/, ''));
      elements.push(
        <h1 key={`h1-${key++}`} style={{ fontSize: '17px', fontWeight: '600', margin: '12px 0 6px 0', color: '#00684A' }}>
          {headerText}
        </h1>
      );
      continue;
    }

    // Numbered lists (1. , 2. , etc.)
    if (line.trim().match(/^\d+\.\s+/)) {
      const numberMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numberMatch) {
        const number = numberMatch[1];
        const listText = formatInlineMarkdown(numberMatch[2]);
        elements.push(
          <div key={`numbered-${key++}`} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
            <span style={{ color: '#00684A', fontWeight: 'bold', minWidth: '20px' }}>{number}.</span>
            <span>{listText}</span>
          </div>
        );
        continue;
      }
    }

    // Bullet points (-, *)
    if (line.trim().match(/^[-*]\s+/)) {
      const bulletText = formatInlineMarkdown(line.replace(/^[-*]\s+/, ''));
      elements.push(
        <div key={`bullet-${key++}`} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
          <span style={{ color: '#00684A', fontWeight: 'bold' }}>•</span>
          <span>{bulletText}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    const formattedLine = formatInlineMarkdown(line);
    elements.push(
      <p key={`p-${key++}`} style={{ margin: '4px 0', lineHeight: '1.5' }}>
        {formattedLine}
      </p>
    );
  }

  return <div className="formatted-markdown">{elements}</div>;
};

/**
 * Format inline markdown (bold, code, etc.)
 */
const formatInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let key = 0;
  let lastIndex = 0;

  // Combined regex to match both bold (**text**) and inline code (`code`)
  const combinedRegex = /(\*\*(.*?)\*\*)|(`(.*?)`)/g;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Check if it's bold or code
    if (match[1]) {
      // Bold text (**text**)
      parts.push(
        <strong key={`bold-${key++}`} style={{ fontWeight: '600', color: '#333' }}>
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Inline code (`code`)
      parts.push(
        <code 
          key={`code-${key++}`} 
          style={{ 
            background: '#f5f5f5', 
            padding: '2px 6px', 
            borderRadius: '3px', 
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#e83e8c'
          }}
        >
          {match[4]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
};

