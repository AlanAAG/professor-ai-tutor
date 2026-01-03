import { Sparkles, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import type { Message } from "@/pages/ProfessorAI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfessorMessageProps {
  message: Message;
  isStreaming?: boolean;
  messageId?: string;
}

// Parse and render content with LaTeX support
const renderContentWithLatex = (content: string) => {
  const parts: React.ReactNode[] = [];

  // Process block math first ($$...$$)
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  let lastIndex = 0;
  let match;

  const segments: { type: 'text' | 'blockMath'; content: string }[] = [];
  
  while ((match = blockMathRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'blockMath', content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) });
  }

  // Now process each segment
  segments.forEach((segment, segIndex) => {
    if (segment.type === 'blockMath') {
      try {
        parts.push(
          <div key={`block-${segIndex}`} className="my-4 overflow-x-auto">
            <BlockMath math={segment.content} />
          </div>
        );
      } catch {
        parts.push(<span key={`block-${segIndex}`} className="text-destructive">{`$$${segment.content}$$`}</span>);
      }
    } else {
      // Process inline math ($...$) in text segments
      const inlineParts = processInlineMath(segment.content, segIndex);
      parts.push(...inlineParts);
    }
  });

  return parts;
};

// Process inline math and render markdown
const processInlineMath = (text: string, segmentIndex: number): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const inlineMathRegex = /\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  while ((match = inlineMathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textPart = text.slice(lastIndex, match.index);
      parts.push(
        <span key={`md-${segmentIndex}-${partIndex++}`}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <span className="inline">{children}</span>,
              h1: ({ children }) => <h1 className="text-xl font-bold text-primary mt-4 mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold text-primary mt-4 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h3>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc ml-4 my-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 my-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-foreground/90">{children}</li>,
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>;
                }
                return (
                  <pre className="bg-muted p-3 rounded-lg my-2 overflow-x-auto">
                    <code className="text-sm font-mono">{children}</code>
                  </pre>
                );
              },
              pre: ({ children }) => <>{children}</>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 my-2 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {textPart}
          </ReactMarkdown>
        </span>
      );
    }
    try {
      parts.push(
        <InlineMath key={`inline-${segmentIndex}-${partIndex++}`} math={match[1]} />
      );
    } catch {
      parts.push(<span key={`inline-${segmentIndex}-${partIndex++}`}>{`$${match[1]}$`}</span>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(
      <span key={`md-${segmentIndex}-${partIndex}`}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <span className="inline">{children}</span>,
            h1: ({ children }) => <h1 className="text-xl font-bold text-primary mt-4 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold text-primary mt-4 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h3>,
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => <ul className="list-disc ml-4 my-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 my-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-foreground/90">{children}</li>,
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>;
              }
              return (
                <pre className="bg-muted p-3 rounded-lg my-2 overflow-x-auto">
                  <code className="text-sm font-mono">{children}</code>
                </pre>
              );
            },
            pre: ({ children }) => <>{children}</>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 my-2 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            a: ({ children, href }) => (
              <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {remainingText}
        </ReactMarkdown>
      </span>
    );
  }

  return parts;
};

export const ProfessorMessage = ({ message, isStreaming = false, messageId }: ProfessorMessageProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing feedback on mount
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
          setFeedback(data.feedback_type as 'up' | 'down');
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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (type: 'up' | 'down') => {
    if (!messageId || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("Please sign in to provide feedback");
        return;
      }

      const userId = session.session.user.id;

      if (feedback === type) {
        // Remove feedback
        await supabase
          .from("message_feedback")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", userId);
        setFeedback(null);
      } else {
        // Upsert feedback
        const { error } = await supabase
          .from("message_feedback")
          .upsert(
            {
              message_id: messageId,
              user_id: userId,
              feedback_type: type,
            },
            { onConflict: "message_id,user_id" }
          );

        if (error) throw error;
        setFeedback(type);
        toast.success("Thanks for your feedback!");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words prose prose-sm max-w-none dark:prose-invert prose-headings:text-primary prose-strong:text-foreground">
          {renderContentWithLatex(message.content)}
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
            
            {messageId && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 ${feedback === 'up' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => handleFeedback('up')}
                  disabled={isSubmitting}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 ${feedback === 'down' ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => handleFeedback('down')}
                  disabled={isSubmitting}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
