import React from 'react';

/**
 * Lightweight syntax highlighter for code snippets shown in reading lessons.
 * Preserves exact text content when read via DOM textContent.
 */
export function highlightReadingCode(code: string): React.ReactNode {
  if (!code) return null;

  const tokenRegex =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:console\.log|console\.error|console\.warn|console|function|const|let|var|return|if|else|for|while|import|from|export|default|class|new|typeof|instanceof|async|await|try|catch|finally|throw|switch|case|break|continue|true|false|null|undefined)\b)|(\b\d+(?:\.\d+)?\b)|([{}()[\].,;:+\-*/%=<>!&|?]+)|([a-zA-Z_$][a-zA-Z0-9_$]*)|(\s+)/g;

  const nodes: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let keyIndex = 0;

  while ((match = tokenRegex.exec(code)) !== null) {
    const [full, comment, str, kw, num, punct, ident, space] = match;
    if (comment) {
      nodes.push(<span key={keyIndex++} className="syntax-token syntax-comment">{comment}</span>);
    } else if (str) {
      nodes.push(<span key={keyIndex++} className="syntax-token syntax-string">{str}</span>);
    } else if (kw) {
      nodes.push(<span key={keyIndex++} className="syntax-token syntax-keyword">{kw}</span>);
    } else if (num) {
      nodes.push(<span key={keyIndex++} className="syntax-token syntax-number">{num}</span>);
    } else if (punct) {
      nodes.push(<span key={keyIndex++} className="syntax-token syntax-punct">{punct}</span>);
    } else if (ident) {
      nodes.push(<span key={keyIndex++} className="syntax-token syntax-ident">{ident}</span>);
    } else if (space) {
      nodes.push(space);
    } else {
      nodes.push(full);
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < code.length) {
    nodes.push(code.slice(lastIndex));
  }

  return <>{nodes}</>;
}
