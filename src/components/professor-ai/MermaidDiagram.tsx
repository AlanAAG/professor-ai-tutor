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
        } catch (error) {
          console.error("Failed to render mermaid diagram", error);
          setSvg(`<div class="text-destructive text-sm p-4 border border-destructive/20 rounded">Failed to render diagram</div>`);
        }
      }
    };
    renderDiagram();
  }, [chart]);

  return (
    <div
      className="my-6 overflow-x-auto max-w-full flex justify-center bg-secondary/20 p-4 rounded-xl border border-border/50"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
