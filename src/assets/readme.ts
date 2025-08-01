// Import README.md content directly using Vite's raw import
import readmeContent from '../../README.md?raw';

/**
 * Process the README content for use with the Markdown component.
 * This ensures proper rendering of markdown content:
 * 1. Ensures proper line breaks
 * 2. Handles relative links properly
 */
export const processMarkdown = (content: string): string => {
  return (
    content
      // Ensure proper line breaks
      .replace(/\r\n/g, '\n')
      // Handle relative links (remove leading ./ if present)
      .replace(/\]\(\.\//g, '](')
  );
};

export const readme = processMarkdown(readmeContent);
