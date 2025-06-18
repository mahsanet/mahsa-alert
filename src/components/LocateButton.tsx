import { Navigation, NavigationOff } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useUserLocation } from "../map-entities/user-location.context";
import LocationPrivacyModal from "./LocationPrivacyModal";

interface LocateButtonProps {
	isDarkMode: boolean;
}

const LocateButton: React.FC<LocateButtonProps> = ({ isDarkMode }) => {
	const { setUserLocation } = useUserLocation();

	const [isLocating, setIsLocating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [watchId, setWatchId] = useState<number | null>(null);
	const [showPrivacyModal, setShowPrivacyModal] = useState(false);
	const [hasLocationPermission, setHasLocationPermission] = useState(false);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (watchId) {
				navigator.geolocation.clearWatch(watchId);
			}
		};
	}, [watchId]);

	useEffect(() => {
		const savedPermission = localStorage.getItem("location-permission-granted");
		if (savedPermission === "true") {
			setHasLocationPermission(true);
			// Auto-start location tracking
			startLocationTracking();
		}
	}, []);

	const handleLocateClick = () => {
		setError(null);

		if (!navigator.geolocation) {
			setError("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند");
			return;
		}

		if (watchId) {
			// Stop tracking
			handleStopTracking();
			return;
		}

		// If permission already granted, start directly
		if (hasLocationPermission) {
			startLocationTracking();
		} else {
			// Show privacy modal for first time
			setShowPrivacyModal(true);
		}
	};

	const handlePrivacyAccept = () => {
		setShowPrivacyModal(false);
		setHasLocationPermission(true);
		// Save to localStorage
		localStorage.setItem("location-permission-granted", "true");
		startLocationTracking();
	};

	const handlePrivacyDecline = () => {
		setShowPrivacyModal(false);
		setError("دسترسی به موقعیت لازم است");
		setTimeout(() => setError(null), 3000);
	};

	// Test function with fake location
	// const handleTestLocation = () => {
	// 	const fakeLocation = {
	// 		lat: 35.7863309741177,
	// 		lng: 51.40899896621704,
	// 	};
	// 	console.log("🧪 Setting test location:", fakeLocation);
	// 	onLocationFound(fakeLocation);
	// 	setError(null);
	// };

	const startLocationTracking = () => {
		setIsLocating(true);

		const options = {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 60000,
		};

		const successCallback = (position: GeolocationPosition) => {
			setUserLocation({
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			});
			setError(null);
			setIsLocating(false);
		};

		const errorCallback = (error: GeolocationPositionError) => {
			setIsLocating(false);
			setWatchId(null);

			let errorMessage = "";
			switch (error.code) {
				case error.PERMISSION_DENIED:
					errorMessage = "دسترسی به موقعیت رد شد";
					break;
				case error.POSITION_UNAVAILABLE:
					errorMessage = "موقعیت در دسترس نیست";
					break;
				case error.TIMEOUT:
					errorMessage = "زمان درخواست موقعیت تمام شد";
					break;
				default:
					errorMessage = "خطا در دریافت موقعیت";
					break;
			}
			setError(errorMessage);
		};

		const id = navigator.geolocation.watchPosition(
			successCallback,
			errorCallback,
			options,
		);
		setWatchId(id);
	};

	const handleStopTracking = () => {
		if (watchId) {
			navigator.geolocation.clearWatch(watchId);
			setUserLocation({
				lat: 0,
				lng: 0,
			});
			setWatchId(null);
			setIsLocating(false);
			setHasLocationPermission(false);
			localStorage.removeItem("location-permission-granted");
		}
	};

	const isActive = watchId !== null;
	const isRequestingLocation = isLocating && !isActive;

	return (
		<>
			<LocationPrivacyModal
				isOpen={showPrivacyModal}
				onAccept={handlePrivacyAccept}
				onDecline={handlePrivacyDecline}
				isDarkMode={isDarkMode}
			/>

			<div className="fixed top-36 right-4 z-20 flex flex-col gap-2">
				<style>{`
					@keyframes fadeIn {
						from {
							opacity: 0;
							transform: scale(0.9);
						}
						to {
							opacity: 1;
							transform: scale(1);
						}
					}
					
					.animate-fade-in {
						animation: fadeIn 0.2s ease-out forwards;
					}
				`}</style>

				<button
					type="button"
					onClick={handleLocateClick}
					disabled={isRequestingLocation}
					className={`
						w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border
						${
							isActive
								? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
								: isDarkMode
									? "bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
									: "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
						}
						${isRequestingLocation ? "opacity-75 cursor-not-allowed" : ""}
					`}
					title={
						watchId
							? "توقف ردیابی موقعیت"
							: hasLocationPermission
								? "شروع ردیابی موقعیت"
								: "نمایش موقعیت من"
					}
				>
					{isRequestingLocation ? (
						<div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
					) : watchId ? (
						<Navigation size={18} />
					) : (
						<NavigationOff size={18} />
					)}
				</button>

				{error && (
					<div
						className={`
						absolute top-14 right-0 min-w-48 p-2 rounded-lg shadow-lg text-xs
						${isDarkMode ? "bg-red-900 text-red-200 border-red-700" : "bg-red-100 text-red-800 border-red-300"}
						border animate-fade-in
					`}
					>
						{error}
					</div>
				)}
			</div>
		</>
	);
};

export default LocateButton;
