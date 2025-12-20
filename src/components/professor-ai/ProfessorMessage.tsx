import { User, Bot } from "lucide-react";
import type { Message } from "@/pages/ProfessorAI";

interface ProfessorMessageProps {
  message: Message;
}

// Simple markdown renderer for headers and basic formatting
const renderMarkdown = (content: string) => {
  const lines = content.split("\n");
  
  return lines.map((line, index) => {
    // H2 headers
    if (line.startsWith("## ")) {
      return (
        <h2 key={index} className="text-lg font-bold text-professor-accent mt-4 mb-2 first:mt-0">
          {line.slice(3)}
        </h2>
      );
    }
    
    // H3 headers
    if (line.startsWith("### ")) {
      return (
        <h3 key={index} className="text-base font-semibold text-professor-fg mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    }
    
    // Bold text
    if (line.includes("**")) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={index} className="mb-2 leading-relaxed">
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-semibold text-professor-fg">
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
        <li key={index} className="ml-4 mb-1 text-professor-fg/90">
          {line.slice(2)}
        </li>
      );
    }
    
    // Numbered lists
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={index} className="ml-4 mb-1 list-decimal text-professor-fg/90">
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
      <p key={index} className="mb-2 leading-relaxed text-professor-fg/90">
        {line}
      </p>
    );
  });
};

export const ProfessorMessage = ({ message }: ProfessorMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-professor-user-bg"
            : "bg-professor-accent/20"
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-professor-user-fg" />
        ) : (
          <Bot className="w-5 h-5 text-professor-accent" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-professor-user-bg text-professor-user-fg rounded-br-md"
            : "bg-professor-assistant-bg text-professor-fg rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm prose-professor">
            {renderMarkdown(message.content)}
          </div>
        )}
      </div>
    </div>
  );
};
