import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useBorders } from "@/map-entities/borders/borders.context";
import type { LocationFeature } from "@/types";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/ui/drawer";
import { calculateBounds } from "./MapComponent.utils";

interface EvacSliderProps {
	onZoomToArea: (bounds: [[number, number], [number, number]]) => void;
	className?: string;
}

interface EvacArea {
	index: number;
	feature: LocationFeature;
	date: Date;
	area: number;
}

const EvacSlider: React.FC<EvacSliderProps> = ({ onZoomToArea, className }) => {
	const { bordersData } = useBorders();
	const [evacAreas, setEvacAreas] = useState<EvacArea[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isOpen, setIsOpen] = useState(true);

	// Extract evacuation areas from the data
	useEffect(() => {
		const evacData = bordersData.evac.data;
		if (!evacData || !evacData.features) return;

		const areas: EvacArea[] = evacData.features
			.map((feature, index) => {
				const date = feature.properties?.Date;
				const area = feature.properties?.Shape__Area;

				if (date && area) {
					return {
						index,
						feature,
						date: new Date(date),
						area: area,
					};
				}
				return null;
			})
			.filter((area): area is EvacArea => area !== null)
			.sort((a, b) => b.date.getTime() - a.date.getTime());

		setEvacAreas(areas);
	}, [bordersData]);

	const handleZoomToCurrent = useCallback(
		(evacAreas: EvacArea[]) => {
			if (evacAreas.length === 0 || currentIndex >= evacAreas.length) return;

			const currentArea = evacAreas[currentIndex];
			const bounds = calculateBounds({
				type: "FeatureCollection",
				crs: bordersData.evac.data!.crs,
				features: [currentArea.feature],
			});

			if (bounds) {
				onZoomToArea(bounds);
			}
		},
		[currentIndex, onZoomToArea, bordersData],
	);

	const handlePrevious = useCallback(() => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	}, [currentIndex]);

	const handleNext = useCallback(() => {
		if (currentIndex < evacAreas.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	}, [currentIndex, evacAreas.length]);

	useEffect(() => {
		handleZoomToCurrent(evacAreas);
	}, [evacAreas, handleZoomToCurrent]);

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("fa-IR", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	if (evacAreas.length === 0) {
		return null;
	}

	const currentArea = evacAreas[currentIndex];

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger asChild>
				<div
					className={`w-full max-w-sm md:max-w-lg px-4 md:px-6 ${className}`}
				>
					<button
						type="button"
						className="w-full bg-black/80 backdrop-blur-md rounded-xl md:rounded-2xl px-6 py-5 md:px-8 md:py-6 text-white border border-gray-600 hover:bg-black/90 transition-colors"
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3 md:gap-4">
								<svg
									className="w-6 h-6 md:w-8 md:h-8 text-red-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								<span className="font-bold text-lg md:text-xl">
									هشدار تخلیه منطقه
								</span>
							</div>
							<span className="text-base md:text-lg text-gray-300 font-semibold">
								{currentIndex + 1} از {evacAreas.length}
							</span>
						</div>
					</button>
				</div>
			</DrawerTrigger>

			<DrawerContent className="rtl bg-black/95 backdrop-blur-md border-gray-600 max-w-screen-sm md:max-w-screen-lg mx-auto text-center">
				<DrawerHeader className="bg-black/95 pb-4 md:pb-8">
					<DrawerTitle className="flex items-center justify-center gap-2 md:gap-4 text-red-400 text-center text-2xl md:text-4xl font-bold">
						<svg
							className="w-6 h-6 md:w-10 md:h-10"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						هشدار تخلیه منطقه
					</DrawerTitle>
					<DrawerDescription className="text-gray-300 text-base md:text-xl mt-3 md:mt-6">
						لطفاً از نزدیک شدن به مناطق مشخص شده خودداری کنید.
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4 md:px-8 pb-4 md:pb-8 space-y-6 md:space-y-10 bg-black/95">
					{/* Evacuation Area Navigation */}
					<div className="flex items-center justify-center gap-4 md:gap-8 py-4 md:py-8 px-3 md:px-6">
						<button
							type="button"
							onClick={handlePrevious}
							disabled={currentIndex === 0}
							className="p-3 md:p-6 rounded-xl md:rounded-2xl bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							aria-label="منطقه قبلی"
						>
							<svg
								className="w-5 h-5 md:w-8 md:h-8 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>

						<div className="text-center min-w-[150px] md:min-w-[320px]">
							<span className="text-lg md:text-3xl font-bold text-white">
								{formatDate(currentArea.date)}
							</span>
						</div>

						<button
							type="button"
							onClick={handleNext}
							disabled={currentIndex === evacAreas.length - 1}
							className="p-3 md:p-6 rounded-xl md:rounded-2xl bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							aria-label="منطقه بعدی"
						>
							<svg
								className="w-5 h-5 md:w-8 md:h-8 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 19l-7-7 7-7"
								/>
							</svg>
						</button>
					</div>

					{/* Source information */}
					<div className="border-t border-gray-600 pt-4 md:pt-8 text-center">
						<div className="space-y-2 md:space-y-4">
							<p className="text-xs md:text-base text-gray-400 leading-relaxed">
								<span className="font-semibold md:font-bold">
									آخرین بروزرسانی:
								</span>{" "}
								۱۶ ژوئن ۲۰۲۵
							</p>
							<p className="text-xs md:text-base text-gray-400 leading-relaxed">
								<span className="font-semibold md:font-bold">منبع:</span> INSS
								Map
							</p>
							<p className="text-blue-200 text-sm">©2025 MahsaNet</p>
						</div>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
};

export default EvacSlider;
