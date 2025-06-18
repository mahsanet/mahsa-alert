import { useTheme } from "@/ui/theme-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
	const { isDarkMode } = useTheme();

	return (
		<div
			className={`h-screen w-full relative overflow-hidden ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
		>
			{children}
		</div>
	);
}
