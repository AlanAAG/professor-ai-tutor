import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fixMarkdownTables(content: string): string {
  // Split by code blocks to avoid modifying code
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // If it's a code block (odd index), return as is
    if (index % 2 === 1) return part;

    // Process text part line by line
    return part.split('\n').map(line => {
      // Check if this line looks like a collapsed table
      if (line.includes('|---') || line.includes('|:--')) {
         // Replace "pipe-space-pipe" with "pipe-newline-pipe" to restore rows
         let fixed = line.replace(/\|\s+\|/g, '|\n|');

         // Ensure newline before the separator row
         fixed = fixed.replace(/\|(-{3,}|:{1}-{2,}|-{2,}:{1})/, (m) => `\n${m}`);

         // Ensure newline after the separator row
         // Use negative lookahead to avoid breaking multi-column separators (e.g. |---|---|)
         fixed = fixed.replace(/(-{3,}|:{1}-{2,}|-{2,}:{1})\|(?![-:])/, (m) => `${m}\n`);

         return fixed;
      }
      return line;
    }).join('\n');
  }).join('');
}
