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

    return fixCollapsedTablesInText(part);
  }).join('');
}

/**
 * Fixes collapsed markdown tables where multiple rows are on a single line.
 * 
 * Two scenarios handled:
 * 1. Entire table collapsed (separator + all rows on one line)
 * 2. Separator on its own line but body rows collapsed
 */
function fixCollapsedTablesInText(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let lastSeparatorColumnCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line IS a separator row (standalone)
    const isSeparatorLine = /^\s*\|[\s]*(:?-{2,}:?[\s]*\|)+\s*$/.test(line);
    
    if (isSeparatorLine) {
      // Count columns in separator
      lastSeparatorColumnCount = (line.match(/\|/g) || []).length - 1;
      result.push(line);
      continue;
    }
    
    // Check if this line contains an embedded separator (entire table on one line)
    const embeddedSeparatorMatch = line.match(/\|[\s]*(:?-{2,}:?)[\s]*\|/);
    
    if (embeddedSeparatorMatch) {
      // Count pipes - if many, it's likely a collapsed table
      const pipeCount = (line.match(/\|/g) || []).length;
      if (pipeCount >= 8) {
        result.push(reconstructTable(line));
        lastSeparatorColumnCount = 0;
        continue;
      }
    }
    
    // Check if this is a data row that might be collapsed (after we've seen a separator)
    if (lastSeparatorColumnCount > 0 && line.includes('|')) {
      const pipeCount = (line.match(/\|/g) || []).length;
      const expectedPipes = lastSeparatorColumnCount + 1;
      
      // If we have more pipes than expected for a single row, rows are collapsed
      if (pipeCount > expectedPipes + 1) {
        const splitRows = splitCollapsedBodyRows(line, lastSeparatorColumnCount);
        result.push(...splitRows);
        continue;
      }
    }
    
    // Reset separator context if we hit a non-table line
    if (!line.includes('|') && line.trim() !== '') {
      lastSeparatorColumnCount = 0;
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

/**
 * Splits collapsed body rows based on known column count.
 * Example: "| A | B | C | | D | E | F |" with 3 columns becomes two rows.
 */
function splitCollapsedBodyRows(line: string, columnCount: number): string[] {
  const rows: string[] = [];
  let remaining = line.trim();
  const pipesPerRow = columnCount + 1;
  
  while (remaining.length > 0) {
    // Find pipe positions
    const pipePositions: number[] = [];
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i] === '|') pipePositions.push(i);
    }
    
    if (pipePositions.length < 2) break;
    
    if (pipePositions.length < pipesPerRow) {
      // Not enough pipes for a full row, take what we have
      if (remaining.trim()) rows.push(remaining.trim());
      break;
    }
    
    // Extract one row (up to and including the Nth pipe)
    const rowEndPipe = pipePositions[pipesPerRow - 1];
    const row = remaining.substring(0, rowEndPipe + 1).trim();
    
    if (row && row !== '|') {
      rows.push(row);
    }
    
    // Move to next potential row
    remaining = remaining.substring(rowEndPipe + 1).trim();
  }
  
  return rows.length > 0 ? rows : [line];
}

/**
 * Reconstructs a collapsed table where header, separator, and body are all on one line.
 */
function reconstructTable(collapsedLine: string): string {
  // Find the full separator row pattern
  const separatorRegex = /(\|[\s]*(?::?-{2,}:?[\s]*\|)+)/;
  const sepMatch = collapsedLine.match(separatorRegex);
  
  if (!sepMatch) return collapsedLine;

  const separatorRow = sepMatch[1].trim();
  const sepIndex = collapsedLine.indexOf(separatorRow);
  
  // Extract header (before separator) and body (after separator)
  const headerPart = collapsedLine.substring(0, sepIndex).trim();
  const bodyPart = collapsedLine.substring(sepIndex + separatorRow.length).trim();

  // Count columns from separator row
  const columnCount = (separatorRow.match(/\|/g) || []).length - 1;
  
  // Split body into rows based on column count
  const bodyRows = splitCollapsedBodyRows(bodyPart, columnCount);
  
  // Reconstruct the table
  const result = [
    headerPart,
    separatorRow,
    ...bodyRows
  ].filter(row => row.trim()).join('\n');

  return result;
}
