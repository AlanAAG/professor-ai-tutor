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

  if (!svg) {
    return (
      <div className="my-6 text-sm text-muted-foreground animate-pulse p-4 border rounded-md bg-muted/50 min-h-[200px] flex items-center transition-all duration-200">
        Drawing diagram...
      </div>
    );
  }

  return (
    <div
      className="my-6 overflow-x-auto max-w-full flex justify-center bg-secondary/20 p-4 rounded-xl border border-border/50 transition-all duration-200"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
