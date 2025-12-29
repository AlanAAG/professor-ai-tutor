import { Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Message } from "@/pages/ProfessorAI";
import { MermaidDiagram } from "./MermaidDiagram";

interface ProfessorMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export const ProfessorMessage = ({ message, isStreaming = false }: ProfessorMessageProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%] md:max-w-[70%]">
          <div className="bg-white text-black px-4 py-3 rounded-2xl rounded-br-md shadow-md">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in">
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg">
        <Sparkles className="w-4 h-4 text-primary-foreground" />
      </div>
      
      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-sm leading-relaxed text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-3 prose-li:my-1 prose-pre:my-3 prose-ul:my-2 prose-ol:my-2 [&_.katex]:text-foreground [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1({ children, ...props }) {
                return (
                  <h1 className="text-xl font-bold text-primary mt-6 mb-3 first:mt-0" {...props}>
                    {children}
                  </h1>
                );
              },
              h2({ children, ...props }) {
                return (
                  <h2 className="text-lg font-semibold text-white mt-5 mb-2" {...props}>
                    {children}
                  </h2>
                );
              },
              h3({ children, ...props }) {
                return (
                  <h3 className="text-base font-semibold text-foreground/90 mt-4 mb-2" {...props}>
                    {children}
                  </h3>
                );
              },
              hr({ ...props }) {
                return (
                  <hr className="my-4 border-t border-muted-foreground/30" {...props} />
                );
              },
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";
                const codeContent = String(children).replace(/\n$/, "");

                // Render mermaid diagrams
                if (language === "mermaid") {
                  return <MermaidDiagram chart={codeContent} />;
                }

                // Inline code
                if (!className) {
                  return (
                    <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                }

                // Code blocks
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />
          )}
        </div>
        
        {/* Action buttons - only show when not streaming */}
        {!isStreaming && message.content.length > 0 && (
          <div className="flex items-center gap-1 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
