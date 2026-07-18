interface MentionProps {
  username: string;
}

export function Mention({ username }: MentionProps) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/50 p-2 text-white">
      <p className="text-center font-bold">@{username}</p>
    </div>
  );
}