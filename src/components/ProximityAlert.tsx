import { AlertTriangle, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useLayers } from "../map-entities/layers.context";
import {
	checkLocationProximity,
	generateWarningMessage,
	type ProximityResult,
} from "../utils/locationProximity";

interface ProximityAlertProps {
	userLocation: { lat: number; lng: number } | null;
}

const ProximityAlert: React.FC<ProximityAlertProps> = ({ userLocation }) => {
	const { layersData } = useLayers();

	const [proximityResult, setProximityResult] =
		useState<ProximityResult | null>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);

	useEffect(() => {
		if (!userLocation) {
			setProximityResult(null);
			setIsVisible(false);
			return;
		}

		console.log("🔍 Checking proximity for location:", userLocation);
		console.log("📊 Available data sources:", {
			strikes: layersData.strikes.data?.features?.length || 0,
			sites: layersData.sites.data?.features?.length || 0,
			nuclear: layersData.nuclear.data?.features?.length || 0,
		});

		try {
			const result = checkLocationProximity(userLocation, layersData, 3);
			console.log("✅ Proximity result:", result);
			setProximityResult(result);
			setIsVisible(result.isInDanger);
			setIsMinimized(false);
		} catch (error) {
			console.error("❌ Error checking proximity:", error);
			setProximityResult(null);
			setIsVisible(false);
		}
	}, [userLocation, layersData]);

	const handleClose = () => {
		setIsVisible(false);
	};

	const handleMinimize = () => {
		setIsMinimized(!isMinimized);
	};

	if (!isVisible || !proximityResult) {
		return null;
	}

	const warningMessage = generateWarningMessage(proximityResult);

	return (
		<>
			<style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${proximityResult.isInDanger ? "#dc2626" : "#16a34a"};
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${proximityResult.isInDanger ? "#b91c1c" : "#15803d"};
        }
      `}</style>

			<div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none">
				<div
					className={`
          w-full max-w-xs sm:max-w-sm md:max-w-md rounded-xl shadow-2xl border-2 transition-all duration-300 ease-out pointer-events-auto
          ${
						proximityResult.isInDanger
							? "border-orange-500 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
							: "border-green-500 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
					}
          ${isMinimized ? "h-16" : "min-h-24"}
          overflow-hidden transform hover:scale-[1.02]
        `}
				>
					{/* Header */}
					<button
						type="button"
						className="flex items-center justify-between p-3 sm:p-4 cursor-pointer border-b border-gray-200 dark:border-gray-700"
						onClick={handleMinimize}
					>
						<div className="flex items-center gap-3">
							<div
								className={`p-2 rounded-full ${
									proximityResult.isInDanger
										? "bg-orange-100 dark:bg-orange-700/50"
										: "bg-green-100 dark:bg-green-900/50"
								}`}
							>
								<AlertTriangle
									className={`w-5 h-5 ${
										proximityResult.isInDanger
											? "text-orange-600 dark:text-orange-400"
											: "text-green-600 dark:text-green-400"
									}`}
								/>
							</div>
							<div>
								<h3
									className={`font-bold text-base sm:text-lg ${
										proximityResult.isInDanger
											? "text-orange-800 dark:text-orange-200"
											: "text-green-800 dark:text-green-200"
									}`}
								>
									{proximityResult.isInDanger ? "هشدار امنیتی" : "منطقه امن"}
								</h3>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									{proximityResult.isInDanger
										? "کلیک برای جزئیات"
										: "شما در امان هستید"}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									handleClose();
								}}
								className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
									proximityResult.isInDanger
										? "text-orange-600 hover:text-orange-700 dark:text-orange-400"
										: "text-green-600 hover:text-green-700 dark:text-green-400"
								}`}
								title="بستن"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</button>

					{/* Content */}
					{!isMinimized && (
						<div className="p-4 sm:p-5 space-y-4">
							<div
								className={`p-3 rounded-lg border ${
									proximityResult.isInDanger
										? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
										: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
								}`}
							>
								<p
									className={`text-sm sm:text-base font-medium leading-relaxed ${
										proximityResult.isInDanger
											? "text-orange-800 dark:text-orange-200"
											: "text-green-800 dark:text-green-200"
									}`}
									dir="rtl"
								>
									{warningMessage}
								</p>
							</div>

							{proximityResult.isInDanger &&
								proximityResult.nearbyPoints.length > 0 && (
									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<AlertTriangle className="w-4 h-4 text-orange-500" />
											<h4 className="text-sm font-bold text-orange-700 dark:text-orange-300">
												نقاط خطرناک نزدیک
											</h4>
										</div>

										<div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
											{proximityResult.nearbyPoints.slice(0, 5).map((point) => (
												<div
													key={`${point.coordinates[0]}-${point.coordinates[1]}`}
													className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-orange-200 dark:border-orange-800"
												>
													<div className="flex items-center gap-2 flex-1 min-w-0">
														<span className="text-lg flex-shrink-0">
															{point.type === "strikes"
																? "🎯"
																: point.type === "nuclear"
																	? "☢️"
																	: "🚀"}
														</span>
														<span
															className="text-xs sm:text-sm text-orange-800 dark:text-orange-200 truncate"
															dir="rtl"
														>
															{point.properties?.SiteTargeted ||
																point.properties?.Site ||
																point.properties?.BASES_CLUSTER ||
																"نقطه نامشخص"}
														</span>
													</div>
													<div className="flex-shrink-0 ml-2">
														<span className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-full">
															{point.distance} کیلومتر
														</span>
													</div>
												</div>
											))}

											{proximityResult.nearbyPoints.length > 5 && (
												<div className="text-center py-2">
													<span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-3 py-1 rounded-full">
														و {proximityResult.nearbyPoints.length - 5} نقطه
														دیگر...
													</span>
												</div>
											)}
										</div>
									</div>
								)}
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default ProximityAlert;
