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
        className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
      >
        <Icon
          size={32}
          className="text-white sm:w-10 sm:h-10 lg:w-12 lg:h-12"
        />
      </div>
      <span className="text-gray-300 text-xs sm:text-sm font-medium group-hover:text-white transition-colors text-center leading-tight">
        {title}
      </span>
    </button>
  );
}
