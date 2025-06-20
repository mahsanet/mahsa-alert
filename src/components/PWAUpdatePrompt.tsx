import { useEffect, useState } from "react";

export function PWAUpdatePrompt() {
	const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

	useEffect(() => {
		const handleUpdateFound = () => {
			setShowUpdatePrompt(true);
		};

		// Listen for service worker updates
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.addEventListener(
				"controllerchange",
				handleUpdateFound,
			);
		}

		return () => {
			if ("serviceWorker" in navigator) {
				navigator.serviceWorker.removeEventListener(
					"controllerchange",
					handleUpdateFound,
				);
			}
		};
	}, []);

	const handleUpdate = () => {
		window.location.reload();
	};

	const handleDismiss = () => {
		setShowUpdatePrompt(false);
	};

	if (!showUpdatePrompt) {
		return null;
	}

	return (
		<div className="fixed top-4 left-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
						<svg
							className="w-4 h-4 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Update Available</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
					<div>
						<h3 className="font-semibold text-blue-900">Update Available</h3>
						<p className="text-sm text-blue-700">
							A new version of Mahsa Alert is ready
						</p>
					</div>
				</div>
				<div className="flex space-x-2">
					<button
						type="button"
						onClick={handleDismiss}
						className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
					>
						Later
					</button>
					<button
						type="button"
						onClick={handleUpdate}
						className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
					>
						Update
					</button>
				</div>
			</div>
		</div>
	);
}
