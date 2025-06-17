import type React from "react";
import { useState } from "react";
import { FaFilter, FaTimes } from "react-icons/fa";

export interface LayerConfig {
	id: string;
	name: string;
	color: string;
	visible: boolean;
}

interface LayerFilterProps {
	layers: LayerConfig[];
	onLayerToggle: (layerId: string, visible: boolean) => void;
}

const LayerFilter: React.FC<LayerFilterProps> = ({ layers, onLayerToggle }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<div className="fixed top-20 right-4 z-50 rtl">
			{!isExpanded ? (
				<button
					type="button"
					onClick={toggleExpanded}
					className="w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border border-gray-600"
				>
					<FaFilter size={18} />
				</button>
			) : (
				<div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 min-w-64 backdrop-blur-sm">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-white font-semibold text-lg">فیلتر</h3>
						<button
							type="button"
							onClick={toggleExpanded}
							className="text-gray-400 hover:text-white transition-colors"
						>
							<FaTimes size={16} />
						</button>
					</div>

					<div className="space-y-3">
						{layers.map((layer) => (
							<div key={layer.id} className="flex items-center justify-between">
								<div className="flex items-center space-x-3 rtl:space-x-reverse">
									{/*<div*/}
									{/*  className="w-3 h-3 rounded-full ml-2"*/}
									{/*  style={{ backgroundColor: layer.color }}*/}
									{/*/>*/}
									<span className="text-white text-sm">{layer.name}</span>
								</div>

								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={layer.visible}
										onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
										className="sr-only peer"
									/>
									<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
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
