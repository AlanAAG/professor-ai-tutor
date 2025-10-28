import { Clock } from "lucide-react";

const CountdownTimer = () => {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 border border-accent/40 w-fit">
      <Clock className="w-4 h-4 text-accent" />
      <span className="text-xs font-semibold text-accent">
        Limited Time Only
      </span>
    </div>
  );
};

export default CountdownTimer;
