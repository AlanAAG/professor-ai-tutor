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

    // Look for collapsed tables - lines with separator pattern and many pipes
    // Pattern: content before separator | separator row | body rows all on one line
    return fixCollapsedTablesInText(part);
  }).join('');
}

/**
 * Fixes collapsed markdown tables where all rows are on a single line.
 * Example input: "| Col1 | Col2 | | |---| | A | B | | C | D |"
 * Example output: properly formatted table with newlines
 */
function fixCollapsedTablesInText(text: string): string {
  // Process line by line
  return text.split('\n').map(line => {
    // Check if this line contains a table separator pattern (|---|, |:--|, etc.)
    const separatorMatch = line.match(/\|[\s]*(:?-{2,}:?)[\s]*\|/);
    if (!separatorMatch) return line;

    // Count pipes - a proper table row has pipes but if there are too many on one line, it's collapsed
    const pipeCount = (line.match(/\|/g) || []).length;
    
    // If there are many pipes (suggesting multiple rows collapsed), try to fix it
    // A normal 2-column table row has 3 pipes, 3-column has 4 pipes, etc.
    // If we see more than ~10 pipes on a line with a separator, it's likely collapsed
    if (pipeCount < 10) return line;

    return reconstructTable(line);
  }).join('\n');
}

/**
 * Reconstructs a collapsed table by:
 * 1. Finding the separator row pattern
 * 2. Splitting into header and body
 * 3. Breaking body into individual rows
 */
function reconstructTable(collapsedLine: string): string {
  // Find the full separator row pattern (e.g., |---|---| or |:--|:--|)
  // This matches: | followed by dashes/colons, repeated for multiple columns, ending with |
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
  
  // Split body into rows based on pipe patterns
  // Each row should have (columnCount + 1) pipes
  const bodyRows = splitIntoRows(bodyPart, columnCount);
  
  // Reconstruct the table
  const result = [
    headerPart,
    separatorRow,
    ...bodyRows
  ].filter(row => row.trim()).join('\n');

  return result;
}

/**
 * Splits a collapsed body section into individual rows based on column count.
 */
function splitIntoRows(bodyPart: string, columnCount: number): string[] {
  if (!bodyPart.trim()) return [];

  const rows: string[] = [];
  let remaining = bodyPart.trim();
  
  // Pattern: each row starts with | and has (columnCount) cells
  // We need to find where one row ends and another begins
  // Look for pattern: "| content | content |" repeated
  
  while (remaining.length > 0) {
    // Find pipes in remaining content
    let pipePositions: number[] = [];
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i] === '|') pipePositions.push(i);
    }
    
    if (pipePositions.length < 2) break;
    
    // A row needs (columnCount + 1) pipes: | cell1 | cell2 | ... | cellN |
    // Find the position of the (columnCount + 1)th pipe
    const pipesNeeded = columnCount + 1;
    
    if (pipePositions.length < pipesNeeded) {
      // Not enough pipes for a full row, take what we have
      rows.push(remaining.trim());
      break;
    }
    
    // Extract one row
    const rowEndPipe = pipePositions[pipesNeeded - 1];
    const row = remaining.substring(0, rowEndPipe + 1).trim();
    
    if (row) {
      rows.push(row);
    }
    
    // Move to next potential row
    remaining = remaining.substring(rowEndPipe + 1).trim();
  }
  
  return rows;
}
