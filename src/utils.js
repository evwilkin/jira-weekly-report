/**
 * Extract plain text from Jira comment body (Atlassian Document Format)
 * @param {Object} body - The comment body object
 * @returns {string} Plain text representation
 */
export function extractCommentText(body) {
  if (!body) return 'No content';

  // Handle different comment body formats
  if (typeof body === 'string') {
    return body;
  }

  // Handle Atlassian Document Format (ADF)
  if (body.content && Array.isArray(body.content)) {
    return extractFromADF(body.content);
  }

  // Handle legacy format
  if (body.content && typeof body.content === 'string') {
    return body.content;
  }

  return 'No text content available';
}

/**
 * Extract text from Atlassian Document Format content
 * @param {Array} content - ADF content array
 * @returns {string} Plain text
 */
function extractFromADF(content) {
  let text = '';

  for (const node of content) {
    if (node.type === 'paragraph' && node.content) {
      text += extractFromParagraph(node.content) + '\n';
    } else if (node.type === 'text') {
      text += node.text || '';
    } else if (node.type === 'codeBlock' && node.content) {
      text += extractFromADF(node.content);
    } else if (node.type === 'bulletList' && node.content) {
      text += extractFromList(node.content);
    } else if (node.type === 'orderedList' && node.content) {
      text += extractFromList(node.content);
    } else if (node.content) {
      text += extractFromADF(node.content);
    }
  }

  return text.trim();
}

/**
 * Extract text from paragraph content
 * @param {Array} content - Paragraph content array
 * @returns {string} Plain text
 */
function extractFromParagraph(content) {
  let text = '';

  for (const node of content) {
    if (node.type === 'text') {
      text += node.text || '';
    } else if (node.type === 'mention' && node.attrs) {
      text += `@${node.attrs.text || node.attrs.displayName || 'user'}`;
    } else if (node.type === 'inlineCard' && node.attrs) {
      text += node.attrs.url || '[link]';
    } else if (node.content) {
      text += extractFromADF(node.content);
    }
  }

  return text;
}

/**
 * Extract text from list content
 * @param {Array} content - List content array
 * @returns {string} Plain text
 */
function extractFromList(content) {
  let text = '';

  for (const item of content) {
    if (item.type === 'listItem' && item.content) {
      text += '• ' + extractFromADF(item.content) + '\n';
    }
  }

  return text;
}

/**
 * Format a date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}
