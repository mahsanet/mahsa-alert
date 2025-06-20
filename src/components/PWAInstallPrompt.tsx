import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [showInstallPrompt, setShowInstallPrompt] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		// Check if app is already installed
		if (
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as any).standalone === true
		) {
			setIsInstalled(true);
		}

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setShowInstallPrompt(true);
		};

		const handleAppInstalled = () => {
			setIsInstalled(true);
			setShowInstallPrompt(false);
			setDeferredPrompt(null);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			console.log("User accepted the install prompt");
		} else {
			console.log("User dismissed the install prompt");
		}

		setDeferredPrompt(null);
		setShowInstallPrompt(false);
	};

	const handleDismiss = () => {
		setShowInstallPrompt(false);
	};

	if (isInstalled || !showInstallPrompt) {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
						<span className="text-white text-lg font-bold">MA</span>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900">Install Mahsa Alert</h3>
						<p className="text-sm text-gray-600">
							Get quick access to crisis alerts
						</p>
					</div>
				</div>
				<div className="flex space-x-2">
					<button
						type="button"
						onClick={handleDismiss}
						className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
					>
						Not now
					</button>
					<button
						type="button"
						onClick={handleInstallClick}
						className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800"
					>
						Install
					</button>
				</div>
			</div>
		</div>
	);
}
