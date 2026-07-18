interface PollProps {
  question: string;
  options: string[];
}

export function Poll({ question, options }: PollProps) {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-4/5 rounded-lg bg-black/50 p-4 text-white">
      <p className="text-center font-bold mb-4">{question}</p>
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            className="w-full rounded-md bg-white/20 p-2 text-center font-semibold backdrop-blur-sm"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}