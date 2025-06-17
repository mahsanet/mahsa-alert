import { useCallback, useState } from "react";
import Header from "./components/Header";
import LayerFilter from "./components/LayerFilter";
import LocateButton from "./components/LocateButton";
import LocationTooltip from "./components/LocationTooltip";
import MapComponent from "./components/MapComponent";
import ProximityAlert from "./components/ProximityAlert";
import ThemeToggle from "./components/ThemeToggle";
import Legend from "./components/WarningBox";
import { layerIds } from "./map-entities/layers";
import { LayersProvider } from "./map-entities/layers.context";
import type { LocationProperties } from "./types";

interface TooltipState {
	location: LocationProperties;
	x: number;
	y: number;
}

function App() {
	const [isDarkMode, setIsDarkMode] = useState(true);

	const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
	const [warningBoxVisible, setWarningBoxVisible] = useState(true);
	const [isFirstTimeWarning, setIsFirstTimeWarning] = useState(true);
	const [isWarningExpanded, setIsWarningExpanded] = useState(false);
	const [shouldZoomToEvac, setShouldZoomToEvac] = useState(false);
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const handleLocationHover = useCallback(
		(location: LocationProperties | null, mouseEvent?: MouseEvent) => {
			if (location && mouseEvent) {
				setTooltipState({
					location,
					x: mouseEvent.clientX,
					y: mouseEvent.clientY,
				});
			} else {
				setTimeout(() => {
					const tooltipElement = document.querySelector(
						'[data-tooltip="true"]',
					);
					if (!tooltipElement || !tooltipElement.matches(":hover")) {
						setTooltipState(null);

						if (tooltipState && !location && !warningBoxVisible) {
							setWarningBoxVisible(true);
							setIsWarningExpanded(false);
						}
					}
				}, 50);
			}
		},
		[tooltipState, warningBoxVisible],
	);

	const handleMouseMove = useCallback(
		(mouseEvent: MouseEvent) => {
			if (tooltipState) {
				setTooltipState((prev) =>
					prev
						? {
								...prev,
								x: mouseEvent.clientX,
								y: mouseEvent.clientY,
							}
						: null,
				);
			}
		},
		[tooltipState],
	);

	const handleCloseWarningBox = useCallback(() => {
		setWarningBoxVisible(false);
		if (isFirstTimeWarning) {
			setIsFirstTimeWarning(false);
		}
		setIsWarningExpanded(false);
	}, [isFirstTimeWarning]);

	const handleExpandWarning = useCallback(() => {
		setIsWarningExpanded(true);
	}, []);

	const handleLayerToggle = useCallback(
		(layerId: keyof typeof layerIds, visible: boolean) => {
			// Zoom to evacuation area when evac layer is turned on
			if (layerId === layerIds.evac && visible) {
				setShouldZoomToEvac(true);
				// Reset zoom trigger after a delay
				setTimeout(() => setShouldZoomToEvac(false), 100);
			}
		},
		[],
	);

	const handleThemeToggle = useCallback(() => {
		setIsDarkMode((prev) => !prev);
	}, []);

	const handleLocationFound = useCallback(
		(coords: { lat: number; lng: number }) => {
			setUserLocation(coords);
		},
		[],
	);

	return (
		<div
			className={`h-screen w-full relative overflow-hidden ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
		>
			<Header />
			<ThemeToggle isDarkMode={isDarkMode} onToggle={handleThemeToggle} />

			<LayersProvider>
				<div className="h-full w-full">
					<MapComponent
						onLocationHover={handleLocationHover}
						onMouseMove={handleMouseMove}
						isDarkMode={isDarkMode}
						shouldZoomToEvac={shouldZoomToEvac}
						userLocation={userLocation}
					/>
				</div>

				<Legend
					isVisible={warningBoxVisible}
					onClose={handleCloseWarningBox}
					isCompact={!isFirstTimeWarning && !isWarningExpanded}
					onExpand={handleExpandWarning}
				/>
				<LayerFilter onLayerToggle={handleLayerToggle} />
				<LocateButton
					onLocationFound={handleLocationFound}
					isDarkMode={isDarkMode}
				/>
				<ProximityAlert userLocation={userLocation} />
				<LocationTooltip
					tooltipState={tooltipState}
					onClose={() => setTooltipState(null)}
				/>
			</LayersProvider>

			{/* Instructions overlay for mobile */}
			<div className="absolute bottom-6 right-6 md:hidden bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs max-w-48">
				<p>Tap locations to explore and zoom in</p>
			</div>
		</div>
	);
}

export default App;
