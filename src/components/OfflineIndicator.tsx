import { useEffect, useState } from "react";

export function OfflineIndicator() {
	const [isOffline, setIsOffline] = useState(!navigator.onLine);

	useEffect(() => {
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (!isOffline) {
		return null;
	}

	return (
		<div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-2 px-4">
			<div className="flex items-center justify-center space-x-2">
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Offline</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
					/>
				</svg>
				<span className="text-sm font-medium">
					You are offline. Some features may be limited.
				</span>
			</div>
		</div>
	);
}
