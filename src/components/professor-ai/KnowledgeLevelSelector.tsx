import { Sprout, Compass, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export type KnowledgeLevel = "Novice" | "Intermediate" | "Expert";

interface LevelOption {
  level: KnowledgeLevel;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const levelOptions: LevelOption[] = [
  {
    level: "Novice",
    title: "Novice",
    description: "I'm new to this.",
    icon: <Sprout className="w-8 h-8" />,
    gradient: "from-green-400/20 to-emerald-500/20",
  },
  {
    level: "Intermediate",
    title: "Intermediate",
    description: "I know the basics.",
    icon: <Compass className="w-8 h-8" />,
    gradient: "from-blue-400/20 to-cyan-500/20",
  },
  {
    level: "Expert",
    title: "Expert",
    description: "Deep dive.",
    icon: <Trophy className="w-8 h-8" />,
    gradient: "from-amber-400/20 to-orange-500/20",
  },
];

interface KnowledgeLevelSelectorProps {
  topic?: string;
  onSelect: (level: KnowledgeLevel) => void;
}

export const KnowledgeLevelSelector = ({
  topic,
  onSelect,
}: KnowledgeLevelSelectorProps) => {
  return (
    <div className="w-full animate-fade-in">
      {/* Calibration header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-chat-text">
          {topic ? `Let's calibrate your plan for "${topic}"` : "What's your knowledge level?"}
        </h3>
        <p className="text-sm text-chat-text-secondary mt-1">
          Select your experience level to personalize your learning
        </p>
      </div>

      {/* Level cards */}
      <div className="grid grid-cols-3 gap-3">
        {levelOptions.map((option) => (
          <button
            key={option.level}
            onClick={() => onSelect(option.level)}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-2 p-4 md:p-6 rounded-2xl",
              "bg-gradient-to-br backdrop-blur-xl border border-white/10",
              "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
              "transition-all duration-300 ease-out",
              "hover:scale-[1.02] active:scale-[0.98]",
              option.gradient
            )}
          >
            {/* Glass overlay */}
            <div className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-md" />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="p-3 rounded-xl bg-white/10 text-chat-text group-hover:text-primary transition-colors">
                {option.icon}
              </div>
              <span className="font-semibold text-chat-text text-sm md:text-base">
                {option.title}
              </span>
              <span className="text-xs text-chat-text-secondary text-center hidden md:block">
                {option.description}
              </span>
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
};
