export const Badge = ({ badge }: { badge: any }) => {
  return (
    <div className="flex items-center gap-2">
      <img src={badge.imageUrl} alt={badge.name} className="w-8 h-8" />
      <div>
        <p className="font-bold">{badge.name}</p>
        <p className="text-sm text-gray-500">{badge.description}</p>
      </div>
    </div>
  );
};