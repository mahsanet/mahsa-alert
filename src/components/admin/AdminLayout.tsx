import { Link, Outlet } from "@tanstack/react-router";
import { FaChartBar, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { useTheme } from "@/ui/theme-provider";

const AdminLayout = () => {
	const { isDarkMode } = useTheme();

	const menuItems = [
		{ icon: FaMapMarkerAlt, label: "Strikes", to: "/admin/strikes" },
		{ icon: FaUsers, label: "Users", to: "/admin/users" },
		{ icon: FaChartBar, label: "Analytics", to: "/admin/analytics" },
	];

	return (
		<div
			className={`min-h-screen flex ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}
		>
			{/* Sidebar */}
			<aside
				className={`w-64 ${isDarkMode ? "bg-gray-800" : "bg-white"} p-4 shadow-lg`}
			>
				<div className="mb-8">
					<h1 className="text-xl font-bold">Admin Dashboard</h1>
				</div>
				<nav>
					<ul className="space-y-2">
						{menuItems.map((item) => (
							<li key={item.to}>
								<Link
									to={item.to}
									className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                    ${
											isDarkMode
												? "hover:bg-gray-700 [&.active]:bg-gray-700"
												: "hover:bg-gray-100 [&.active]:bg-gray-200"
										}`}
								>
									<item.icon className="w-5 h-5" />
									<span>{item.label}</span>
								</Link>
							</li>
						))}
					</ul>
				</nav>
			</aside>

			{/* Main Content */}
			<main className="flex-1 p-8">
				<Outlet />
			</main>
		</div>
	);
};

export default AdminLayout;
