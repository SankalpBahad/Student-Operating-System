export function markdownToPlainText(markdown) {
    return markdown
      // Remove headers
      .replace(/^### (.*$)/gim, '$1')
      .replace(/^## (.*$)/gim, '$1')
      .replace(/^# (.*$)/gim, '$1')
      // Remove bold, italic, and strikethrough text
      .replace(/\*\*(.*)\*\*/gim, '$1')
      .replace(/\*(.*)\*/gim, '$1')
      .replace(/__(.*)__/gim, '$1')
      .replace(/_(.*)_/gim, '$1')
      .replace(/~~(.*)~~/gim, '$1')
      // Remove links
      .replace(/\[(.*?)\]\((.*?)\)/gim, '$1')
      // Remove images
      .replace(/\!\[(.*?)\]\((.*?)\)/gim, '')
      // Remove blockquotes
      .replace(/^\> (.*$)/gim, '$1')
      // Remove lists
      .replace(/^\s*\n\-\s/gim, '')
      .replace(/^\s*\n\*\s/gim, '')
      .replace(/^\s*\n\d\.\s/gim, '')
      // Remove horizontal rules
      .replace(/^[-\s]*$/gim, '')
      // Remove inline code and code blocks
      .replace(/`(.+?)`/gim, '$1')
      .replace(/```(.+?)```/gim, '')
      // Remove extra lines
      .replace(/\n+/gim, '\n')
      .trim();
  }
  
  