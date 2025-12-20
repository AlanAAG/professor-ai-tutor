import { Sparkles, User, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Message } from "@/pages/ProfessorAI";

interface ProfessorMessageProps {
  message: Message;
  isStreaming?: boolean;
}

// Enhanced markdown renderer
const renderMarkdown = (content: string) => {
  const lines = content.split("\n");
  
  return lines.map((line, index) => {
    // H2 headers
    if (line.startsWith("## ")) {
      return (
        <h2 key={index} className="text-lg font-bold text-primary mt-4 mb-2 first:mt-0">
          {line.slice(3)}
        </h2>
      );
    }
    
    // H3 headers
    if (line.startsWith("### ")) {
      return (
        <h3 key={index} className="text-base font-semibold text-foreground mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    }
    
    // Bold text with inline processing
    if (line.includes("**")) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={index} className="mb-2 leading-relaxed">
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    }
    
    // Bullet points
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={index} className="ml-4 mb-1 text-foreground/90 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    
    // Numbered lists
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={index} className="ml-4 mb-1 list-decimal text-foreground/90">
          {line.replace(/^\d+\.\s/, "")}
        </li>
      );
    }
    
    // Empty lines
    if (line.trim() === "") {
      return <br key={index} />;
    }
    
    // Regular paragraphs
    return (
      <p key={index} className="mb-2 leading-relaxed text-foreground/90">
        {line}
      </p>
    );
  });
};

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
        <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
          {renderMarkdown(message.content)}
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
