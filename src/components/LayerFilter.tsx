import type React from "react";
import { useState } from "react";
import { FaFilter, FaTimes } from "react-icons/fa";
import { useLayers } from "@/map-entities/layers/layers.context";
import { useTheme } from "@/ui/theme-provider";

const LayerFilter: React.FC<{ className?: string }> = ({ className }) => {
	const { isDarkMode } = useTheme();
	const [isExpanded, setIsExpanded] = useState(false);
	const { layers, toggleLayerVisibility } = useLayers();

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	const entities = Object.values(layers);

	return (
		<div className={`rtl ${className}`}>
			{!isExpanded ? (
				<button
					type="button"
					onClick={toggleExpanded}
					className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border ${
						isDarkMode
							? "bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
							: "bg-white border-gray-300 hover:bg-gray-300 text-gray-800"
					}`}
				>
					<FaFilter size={18} />
				</button>
			) : (
				<div
					className={`border rounded-lg shadow-xl p-4 min-w-64 backdrop-blur-sm ${
						isDarkMode
							? "bg-gray-800 border-gray-600"
							: "bg-white border-gray-200"
					}`}
				>
					<div className="flex items-center justify-between mb-4">
						<h3
							className={`font-semibold text-lg ${
								isDarkMode ? "text-white" : "text-gray-800"
							}`}
						>
							فیلتر
						</h3>
						<button
							type="button"
							onClick={toggleExpanded}
							className="text-gray-400 hover:text-white transition-colors"
						>
							<FaTimes size={16} />
						</button>
					</div>

					<div className="space-y-3">
						{entities.map((entity) => (
							<div
								key={entity.id}
								className="flex items-center justify-between"
							>
								<div className="flex items-center space-x-3 rtl:space-x-reverse">
									<span
										className={`text-sm ${
											isDarkMode ? "text-white" : "text-gray-800"
										}`}
									>
										{entity.name}
									</span>
								</div>

								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={entity.visible}
										onChange={(e) => {
											toggleLayerVisibility(entity.id, e.target.checked);
										}}
										className="sr-only peer"
									/>
									<div
										className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
											isDarkMode
												? "bg-gray-200 peer-checked:bg-blue-600 peer-checked:after:bg-white"
												: "bg-gray-200 peer-checked:bg-blue-600 peer-checked:after:bg-white"
										}`}
									/>
								</label>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default LayerFilter;
