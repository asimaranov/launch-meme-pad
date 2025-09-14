interface NavigationTabProps {
  title: string;
  isActive: boolean;
  onClick: () => void;
}

export default function NavigationTab({
  title,
  isActive,
  onClick,
}: NavigationTabProps) {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-4 text-lg font-medium transition-colors relative ${
        isActive ? "text-white" : "text-gray-400 hover:text-gray-200"
      }`}
    >
      {title}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
      )}
    </button>
  );
}

