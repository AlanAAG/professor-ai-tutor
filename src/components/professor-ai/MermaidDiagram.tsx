import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with a neutral theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
});

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    const renderDiagram = async () => {
      if (chart) {
        try {
          const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvg(svg);
        } catch {
          // Expected during streaming — silently absorb and clean up orphaned DOM nodes
          setSvg('');
          // Clean up any orphaned mermaid error SVGs that pollute the DOM
          document.querySelectorAll('[id^="dmermaid-"]').forEach(el => el.remove());
        }
      }
    };
    renderDiagram();
  }, [chart]);

  return (
    <div
      className="my-6 overflow-x-auto max-w-full flex justify-center bg-secondary/20 p-4 rounded-xl border border-border/50"
      ref={containerRef}
    >
      {svg ? (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2 py-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Drawing diagram...
        </div>
      )}
    </div>
  );
};
