import { Sparkles, Copy, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import type { Message } from "@/pages/ProfessorAI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FeedbackModal } from "./FeedbackModal";

interface ProfessorMessageProps {
  message: Message;
  isStreaming?: boolean;
  messageId?: string;
  sessionId?: string;
  userQuery?: string;
}

// Check if a paragraph starts with bold text followed by a description (concept pattern)
const isConceptDefinition = (text: string): { term: string; description: string } | null => {
  // Match pattern like "**Term** description..." or "**Term Name** description..."
  const match = text.match(/^\*\*([^*]+)\*\*\s+(.+)$/s);
  if (match) {
    return { term: match[1], description: match[2] };
  }
  return null;
};

// Reusable markdown components configuration
const getMarkdownComponents = (isInline: boolean = false) => ({
  p: ({ children }: { children?: React.ReactNode }) => {
    // For inline rendering, don't wrap in p tags
    if (isInline) {
      return <>{children}</>;
    }
    return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
  },
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-semibold text-primary mt-6 mb-3">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold text-primary mt-5 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-chat-text mt-4 mb-2">{children}</h3>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-primary">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-chat-text-secondary">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-3 ml-1 space-y-2">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-3 ml-1 space-y-2 list-none counter-reset-item">{children}</ol>
  ),
  li: ({ children, ...props }: { children?: React.ReactNode; ordered?: boolean }) => {
    const isOrdered = props.ordered;
    return (
      <li className="relative pl-6 leading-relaxed text-chat-text">
        <span className={cn(
          "absolute left-0 top-0 flex items-start",
          isOrdered ? "text-primary font-medium" : ""
        )}>
          {isOrdered ? null : (
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
          )}
        </span>
        {children}
      </li>
    );
  },
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isCodeBlock = !!className;
    if (isCodeBlock) {
      return (
        <pre className="bg-secondary/60 border border-border/50 p-4 rounded-lg my-4 overflow-x-auto">
          <code className="text-sm font-mono text-chat-text">{children}</code>
        </pre>
      );
    }
    return (
      <code className="bg-secondary/80 px-1.5 py-0.5 rounded text-sm font-mono text-primary">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-primary/50 pl-4 my-4 text-chat-text-secondary italic">
      {children}
    </blockquote>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a 
      href={href} 
      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
});

// Parse and render content with LaTeX support
const renderContentWithLatex = (content: string) => {
  const parts: React.ReactNode[] = [];

  // First split by paragraphs to handle concept definitions
  const paragraphs = content.split(/\n\n+/);
  
  paragraphs.forEach((paragraph, paraIndex) => {
    // Check if this paragraph is a concept definition (starts with **Term**)
    const conceptMatch = isConceptDefinition(paragraph.trim());
    
    if (conceptMatch) {
      // Render as a styled concept block
      parts.push(
        <div key={`concept-${paraIndex}`} className="mb-4">
          <h4 className="text-base font-semibold text-primary mb-2">{conceptMatch.term}</h4>
          <div className="text-chat-text leading-relaxed">
            {processTextWithLatex(conceptMatch.description, `concept-desc-${paraIndex}`)}
          </div>
        </div>
      );
    } else {
      // Process normally with LaTeX support
      const processed = processTextWithLatex(paragraph, `para-${paraIndex}`);
      if (paragraph.trim()) {
        parts.push(
          <div key={`para-${paraIndex}`} className="mb-3 last:mb-0">
            {processed}
          </div>
        );
      }
    }
  });

  return parts;
};

// Process text with both block and inline LaTeX
const processTextWithLatex = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  
  // Process block math first ($$...$$)
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  let lastIndex = 0;
  let match;

  const segments: { type: 'text' | 'blockMath'; content: string }[] = [];
  
  while ((match = blockMathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'blockMath', content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // Now process each segment
  segments.forEach((segment, segIndex) => {
    if (segment.type === 'blockMath') {
      try {
        parts.push(
          <div key={`${keyPrefix}-block-${segIndex}`} className="my-4 overflow-x-auto flex justify-center">
            <BlockMath math={segment.content} />
          </div>
        );
      } catch {
        parts.push(
          <span key={`${keyPrefix}-block-${segIndex}`} className="text-destructive">{`$$${segment.content}$$`}</span>
        );
      }
    } else {
      // Process inline math ($...$) in text segments - keep everything inline
      const inlineParts = processInlineMath(segment.content, `${keyPrefix}-${segIndex}`);
      parts.push(...inlineParts);
    }
  });

  return parts;
};

// Check if a math expression is a full formula (not just a simple number)
const isFullFormula = (math: string): boolean => {
  const trimmed = math.trim();
  
  // Simple numbers (with optional currency/percent sign) should NOT be LaTeX
  // Examples to NOT render as LaTeX: $500, 40%, 1000, $1,000
  const simpleNumberPattern = /^[$€£¥]?\s*[\d,]+(\.\d+)?%?$/;
  if (simpleNumberPattern.test(trimmed)) {
    return false;
  }
  
  // Contains LaTeX commands like \frac, \sqrt, \sum, etc. - IS a formula
  if (/\\[a-zA-Z]+/.test(trimmed)) {
    return true;
  }
  
  // Contains operators between variables/numbers - IS a formula
  // e.g., x + y, a = b, 2x + 3y
  if (/[a-zA-Z].*[+\-*/=].*[a-zA-Z0-9]|[0-9].*[+\-*/=].*[a-zA-Z]/.test(trimmed)) {
    return true;
  }
  
  // Contains subscripts or superscripts - IS a formula
  if (/[_^]/.test(trimmed)) {
    return true;
  }
  
  // Contains Greek letters or special math symbols - IS a formula
  if (/\\(alpha|beta|gamma|delta|sigma|pi|theta|lambda|mu|omega|infty|partial|nabla)/.test(trimmed)) {
    return true;
  }
  
  // If it's just simple text or numbers, don't render as LaTeX
  return false;
};

// Process inline math and render markdown - designed to keep content inline
const processInlineMath = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const inlineMathRegex = /\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  // Use inline markdown components (no p wrapper)
  const inlineMarkdownComponents = getMarkdownComponents(true);

  while ((match = inlineMathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textPart = text.slice(lastIndex, match.index);
      // Render markdown inline without breaking the flow
      parts.push(
        <span key={`${keyPrefix}-md-${partIndex++}`}>
          <ReactMarkdown components={inlineMarkdownComponents}>
            {textPart}
          </ReactMarkdown>
        </span>
      );
    }
    
    const mathContent = match[1];
    
    // Only render as LaTeX if it's a full formula
    if (isFullFormula(mathContent)) {
      try {
        parts.push(
          <InlineMath key={`${keyPrefix}-inline-${partIndex++}`} math={mathContent} />
        );
      } catch {
        parts.push(<span key={`${keyPrefix}-inline-${partIndex++}`}>{`$${mathContent}$`}</span>);
      }
    } else {
      // Render as plain text (preserving the content without $ signs)
      parts.push(<span key={`${keyPrefix}-text-${partIndex++}`}>{mathContent}</span>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(
      <span key={`${keyPrefix}-md-${partIndex}`}>
        <ReactMarkdown components={inlineMarkdownComponents}>
          {remainingText}
        </ReactMarkdown>
      </span>
    );
  }

  return parts;
};

export const ProfessorMessage = ({ message, isStreaming = false, messageId, sessionId, userQuery }: ProfessorMessageProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Load existing feedback on mount (for Supabase local storage)
  useEffect(() => {
    if (!messageId || isUser) return;

    const loadFeedback = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;

        const { data } = await supabase
          .from("message_feedback")
          .select("feedback_type")
          .eq("message_id", messageId)
          .eq("user_id", session.session.user.id)
          .maybeSingle();

        if (data) {
          // Convert 'up'/'down' to rating for display
          const ratingFromType = data.feedback_type === 'up' ? 5 : data.feedback_type === 'down' ? 1 : null;
          if (ratingFromType) setFeedbackRating(ratingFromType);
        }
      } catch (error) {
        console.error("Error loading feedback:", error);
      }
    };

    loadFeedback();
  }, [messageId, isUser]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenFeedbackModal = () => {
    setFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async (rating: number, comment: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Send feedback to /api/feedback endpoint
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          query: userQuery || "",
          response: message.content,
          rating,
          comment: comment || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setFeedbackRating(rating);
      setFeedbackModalOpen(false);
      toast.success("Thanks for your feedback!");

      // Also save to Supabase for local tracking if we have messageId
      if (messageId) {
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          const feedbackType = rating >= 4 ? 'up' : rating <= 2 ? 'down' : 'up';
          await supabase
            .from("message_feedback")
            .upsert(
              {
                message_id: messageId,
                user_id: session.session.user.id,
                feedback_type: feedbackType,
              },
              { onConflict: "message_id,user_id" }
            );
        }
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  // User message - clean white bubble
  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%] md:max-w-[75%]">
          <div className="bg-foreground text-background px-4 py-3 rounded-2xl rounded-br-sm shadow-md">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // AI message - modern clean layout
  return (
    <div className="flex gap-4 animate-fade-in group">
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
        <Sparkles className="w-4 h-4 text-primary-foreground" />
      </div>
      
      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Content area with proper typography */}
        <div className="text-[15px] leading-7 text-chat-text">
          {renderContentWithLatex(message.content)}
          {isStreaming && (
            <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-blink align-middle" />
          )}
        </div>
        
        {/* Action buttons - show on hover or when feedback exists */}
        {!isStreaming && message.content.length > 0 && (
          <div className="flex items-center gap-0.5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            
            {sessionId && (
              <>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-2.5 rounded-lg gap-1",
                    feedbackRating 
                      ? "text-yellow-500" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                  onClick={handleOpenFeedbackModal}
                  disabled={isSubmitting}
                >
                  <Star className={cn("h-4 w-4", feedbackRating && "fill-yellow-400")} />
                  {feedbackRating && <span className="text-xs">{feedbackRating}/5</span>}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
        onSubmit={handleSubmitFeedback}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
