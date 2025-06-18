import { MapPin, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { LocationProperties } from "@/types";

interface TooltipState {
	location: LocationProperties;
	x: number;
	y: number;
}

interface LocationTooltipProps {
	tooltipState: TooltipState | null;
	onClose?: () => void;
}

const formatValue = (value: unknown): string => {
	if (value === null || value === undefined || value === "") {
		return "نامشخص";
	}

	if (typeof value === "number") {
		if (value > 1000000000) {
			const date = new Date(value);
			if (!Number.isNaN(date.getTime())) {
				return date.toLocaleDateString("fa-IR");
			}
		}
		return value.toLocaleString("fa-IR");
	}

	if (typeof value === "string") {
		if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
			try {
				const date = new Date(value);
				return date.toLocaleDateString("fa-IR");
			} catch {
				return value;
			}
		}
		return value;
	}

	if (typeof value === "boolean") {
		return value ? "بله" : "خیر";
	}

	return String(value);
};

const translateFieldName = (key: string): string => {
	const translations: Record<string, string> = {
		Date: "تاریخ",
		SiteTargeted: "مکان",
		Status: "وضعیت",
		LOCATION_of_SITE: "موقعیت پایگاه",
		BASES_CLUSTER: "دسته پایگاه‌ها",
		OBJECTID: "شناسه",
		Field: "فیلد",
		Shape__Area: "مساحت",
		Shape__Length: "طول",
		dataType: "نوع داده",
		name: "نام",
		description: "توضیحات",
		coordinates: "مختصات",
		type: "نوع",
		geometry: "هندسه",
		Site: "سایت",
	};

	return translations[key] || key;
};

const shouldSkipField = (key: string, value: unknown): boolean => {
	const skipFields = ["geometry", "coordinates", "type"];

	if (skipFields.includes(key.toLowerCase())) return true;
	if (value === null || value === undefined || value === "") return true;
	if (typeof value === "object" && !Array.isArray(value)) return true;

	return false;
};

const getDisplayName = (properties: LocationProperties): string => {
	const nameFields = [
		"SiteTargeted",
		"LOCATION_of_SITE",
		"name",
		"Name",
		"title",
		"Title",
		"Site",
	];

	for (const field of nameFields) {
		if (properties[field] && typeof properties[field] === "string") {
			return properties[field];
		}
	}

	return "نامشخص";
};

const getLocationCategory = (
	properties: LocationProperties,
): { label: string; color: string } => {
	if (properties.SiteTargeted || properties.Status) {
		return { label: "حملات تایید شده", color: "bg-orange-500" };
	}

	if (properties.LOCATION_of_SITE || properties.BASES_CLUSTER) {
		return { label: "پایگاه‌های موشکی", color: "bg-red-700" };
	}

	if (properties.Shape__Area || properties.Field !== undefined) {
		return { label: "مناطق تخلیه", color: "bg-red-600" };
	}

	if (properties.Site || properties.Field !== undefined) {
		return { label: "مرکز هسته‌ای", color: "bg-red-600" };
	}

	return { label: "موقعیت", color: "bg-blue-600" };
};

const getFilteredProperties = (
	properties: LocationProperties,
): Record<string, unknown> => {
	const filtered: Record<string, unknown> = {};

	Object.entries(properties).forEach(([key, value]) => {
		if (!shouldSkipField(key, value)) {
			filtered[key] = value;
		}
	});

	return filtered;
};

const LocationTooltip: React.FC<LocationTooltipProps> = ({
	tooltipState,
	onClose,
}) => {
	const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const updateWindowSize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		updateWindowSize();
		window.addEventListener("resize", updateWindowSize);
		return () => window.removeEventListener("resize", updateWindowSize);
	}, []);

	if (!tooltipState || windowSize.width === 0) return null;

	const { location, x, y } = tooltipState;

	const isMobile = windowSize.width < 768;
	const tooltipWidth = isMobile ? Math.min(280, windowSize.width - 32) : 320;

	const displayName = getDisplayName(location);
	const category = getLocationCategory(location);
	const filteredProps = getFilteredProperties(location);

	const tooltipHeight = Math.min(
		isMobile ? 400 : 500,
		Object.keys(filteredProps).length * 40 + 200,
	);
	const padding = isMobile ? 16 : 24;

	let adjustedX = x + 15;
	let adjustedY = y - tooltipHeight / 2;

	if (isMobile) {
		adjustedX = (windowSize.width - tooltipWidth) / 2;
		adjustedY = Math.max(
			padding,
			Math.min(
				y - tooltipHeight / 2,
				windowSize.height - tooltipHeight - padding,
			),
		);
	} else {
		if (adjustedX + tooltipWidth > windowSize.width - padding) {
			adjustedX = x - tooltipWidth - 15;
		}

		if (adjustedY < padding) {
			adjustedY = padding;
		} else if (adjustedY + tooltipHeight > windowSize.height - padding) {
			adjustedY = windowSize.height - tooltipHeight - padding;
		}
	}

	adjustedX = Math.max(
		padding,
		Math.min(adjustedX, windowSize.width - tooltipWidth - padding),
	);
	adjustedY = Math.max(
		padding,
		Math.min(adjustedY, windowSize.height - tooltipHeight - padding),
	);

	// Extract coordinates for Google Maps link
	const getGoogleMapsLink = (location: LocationProperties): string => {
		// Try to get coordinates from different possible sources
		if (
			typeof location.geometry === "object" &&
			"coordinates" in location.geometry
		) {
			const [lng, lat] = location.geometry.coordinates;
			return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
		}

		if (location.coordinates) {
			const [lng, lat] = location.coordinates;
			return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
		}

		if (location.Latitude && location.Longitude) {
			return `https://www.google.com/maps/search/?api=1&query=${location.Latitude},${location.Longitude}`;
		}

		// Fallback - search by name
		const name = getDisplayName(location);
		return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
	};

	const googleMapsLink = getGoogleMapsLink(location);

	return (
		<div
			data-tooltip="true"
			className={`fixed bg-white rounded-2xl shadow-2xl z-50 border border-gray-200 transition-all duration-200 ease-out ${
				isMobile ? "p-4" : "p-5"
			}`}
			style={{
				left: `${adjustedX}px`,
				top: `${adjustedY}px`,
				width: `${tooltipWidth}px`,
				maxHeight: `${tooltipHeight}px`,
				transform: "scale(1)",
				animation: "tooltipFadeIn 0.3s ease-out",
				direction: "rtl",
			}}
			role="tooltip"
			onMouseEnter={(e) => e.stopPropagation()}
			onMouseLeave={(e) => e.stopPropagation()}
		>
			<style>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

			<div className={`${isMobile ? "mb-3" : "mb-4"}`}>
				<div className="flex items-center justify-between mb-3" dir="rtl">
					<h3
						className={`font-bold text-gray-900 persian-text leading-tight text-right flex-1 ${
							isMobile ? "text-base" : "text-lg"
						}`}
					>
						{displayName}
					</h3>
					<div className="flex items-center gap-2">
						<a
							href={googleMapsLink}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-gray-600 transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<MapPin
								className={`text-gray-400 ${isMobile ? "w-4 h-4" : "w-5 h-5"}`}
							/>
						</a>
						{onClose && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onClose();
								}}
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								<X className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
							</button>
						)}
					</div>
				</div>
				<div className="flex items-center justify-start" dir="rtl">
					<span
						className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-white shadow-sm ${category.color} ${
							isMobile ? "text-xs" : "text-xs"
						}`}
					>
						{category.label}
					</span>
				</div>
			</div>

			{Object.keys(filteredProps).length > 0 && (
				<div
					className={`border-t ${isMobile ? "pt-2 space-y-1" : "pt-3 space-y-2"} max-h-80 overflow-y-auto`}
					dir="rtl"
				>
					{Object.entries(filteredProps).map(([key, value]) => (
						<div
							key={key}
							className="flex justify-between items-start py-1 border-b border-gray-50 last:border-b-0"
							dir="rtl"
						>
							<div
								className={`font-medium text-gray-500 persian-text mb-1 ${
									isMobile ? "text-xs" : "text-sm"
								}`}
							>
								{translateFieldName(key)}
							</div>
							<div
								className={`text-gray-900 persian-text break-words ${
									isMobile ? "text-xs" : "text-sm"
								}`}
							>
								{formatValue(value)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default LocationTooltip;
