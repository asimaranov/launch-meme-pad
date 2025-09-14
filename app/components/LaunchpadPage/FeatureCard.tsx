import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  onClick?: () => void;
}

export default function FeatureCard({
  title,
  icon: Icon,
  gradientFrom,
  gradientTo,
  onClick,
}: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center group hover:scale-105 transition-transform duration-200"
    >
      <div
        className={`w-24 h-24 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
      >
        <Icon size={48} className="text-white" />
      </div>
      <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
        {title}
      </span>
    </button>
  );
}

