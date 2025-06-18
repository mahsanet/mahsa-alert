import { Moon, Sun } from "lucide-react";
import type React from "react";
import { useTheme } from "@/ui/theme-provider";

interface ThemeToggleProps {
	className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
	const { setTheme, isDarkMode } = useTheme();

	const handleToggle = () => {
		setTheme(isDarkMode ? "light" : "dark");
	};

	return (
		<button
			type="button"
			onClick={handleToggle}
			className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border ${
				!isDarkMode
					? "bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
					: "bg-white border-gray-300 hover:bg-gray-300 text-gray-800"
			} ${className}`}
			aria-label={isDarkMode ? "پوسته روشن" : "پوسته تاریک"}
		>
			{isDarkMode ? (
				<Sun className="w-5 h-5 text-black" />
			) : (
				<Moon className="w-5 h-5 text-white" />
			)}
		</button>
	);
};

export default ThemeToggle;
