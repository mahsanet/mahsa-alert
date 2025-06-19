import { onMessage } from "firebase/messaging";
import { useEffect, useState } from "react";
import EvacSlider from "./components/EvacSlider";
import Header from "./components/Header";
import IranBorderMap from "./components/IranBorderMap";
import LayerFilter from "./components/LayerFilter";
import Layout from "./components/Layout";
import LocateButton from "./components/LocateButton";
import LocationTooltip from "./components/LocationTooltip";
import ProximityAlert from "./components/ProximityAlert";
import ThemeToggle from "./components/ThemeToggle";
import { messaging } from "./firebase";
import { BordersProvider } from "./map-entities/borders/borders.context";
import { LayersProvider } from "./map-entities/layers/layers.context";
import { UserLocationProvider } from "./map-entities/user-location/user-location.context";
import type { LocationProperties } from "./types";
import { ThemeProvider } from "./ui/theme-provider";
import { requestNotificationPermission } from "./utils/notifications";

interface TooltipState {
	location: LocationProperties;
	x: number;
	y: number;
}

type ZoomToBounds = [[number, number], [number, number]];

function App() {
	const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
	const [_, setZoomToBounds] = useState<ZoomToBounds | null>(null);

	useEffect(() => {
		requestNotificationPermission().catch(console.error);

		onMessage(messaging, (payload) => {
			console.log("Message received in foreground:", payload);
			alert(payload.notification?.title);
		});
	}, []);

	// const handleLocationHover = useCallback(
	// 	(location: LocationProperties | null, mouseEvent?: MouseEvent) => {
	// 		if (location && mouseEvent) {
	// 			setTooltipState({
	// 				location,
	// 				x: mouseEvent.clientX,
	// 				y: mouseEvent.clientY,
	// 			});
	// 		} else {
	// 			setTimeout(() => {
	// 				const tooltipElement = document.querySelector(
	// 					'[data-tooltip="true"]',
	// 				);
	// 				if (!tooltipElement || !tooltipElement.matches(":hover")) {
	// 					setTooltipState(null);
	// 				}
	// 			}, 50);
	// 		}
	// 	},
	// 	[],
	// );

	// const handleMouseMove = useCallback(
	// 	(mouseEvent: MouseEvent) => {
	// 		if (tooltipState) {
	// 			setTooltipState((prev) =>
	// 				prev
	// 					? {
	// 							...prev,
	// 							x: mouseEvent.clientX,
	// 							y: mouseEvent.clientY,
	// 						}
	// 					: null,
	// 			);
	// 		}
	// 	},
	// 	[tooltipState],
	// );

	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<Layout>
				<Header>
					<ThemeToggle className="ml-auto" />
				</Header>

				<UserLocationProvider>
					<LayersProvider>
						<BordersProvider>
							<div className="h-full w-full">
								<IranBorderMap />
								{/* <MapComponent
									onLocationHover={handleLocationHover}
									onMouseMove={handleMouseMove}
									zoomToBounds={zoomToBounds}
								/> */}
							</div>

							<LayerFilter className="fixed top-26 right-5 z-50 " />
							<LocateButton className="fixed top-42 right-5 z-20" />
							<ProximityAlert className="fixed inset-4 z-50" />
							<EvacSlider
								onZoomToArea={setZoomToBounds}
								className="fixed bottom-12 md:bottom-8 left-1/2 transform -translate-x-1/2 z-40"
							/>
							<LocationTooltip
								tooltipState={tooltipState}
								onClose={() => setTooltipState(null)}
							/>
						</BordersProvider>
					</LayersProvider>
				</UserLocationProvider>
			</Layout>
		</ThemeProvider>
	);
}

export default App;
