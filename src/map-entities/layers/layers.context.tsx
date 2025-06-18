import {
	createContext,
	type Dispatch,
	type SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { type Layer, type layerIds, totalLayers } from "./layers";
import { LayersDataRefProvider } from "./layers.context.ref";
import type { LayersData } from "./layers.context.types";
import { getFetchLayerDataPromise, initialLayersData } from "./layers.utils";

interface LayersContextType {
	layers: Layer[];
	setLayers: Dispatch<SetStateAction<Layer[]>>;
	toggleLayerVisibility: (
		layerId: keyof typeof layerIds,
		visible: boolean,
	) => void;
	layersData: LayersData;
	setLayersData: (layersData: LayersData) => void;
	isLayersDataLoaded: boolean;
}

const LayersContext = createContext<LayersContextType>({
	layers: totalLayers,
	setLayers: () => {},
	toggleLayerVisibility: () => {},
	layersData: initialLayersData,
	setLayersData: () => {},
	isLayersDataLoaded: false,
});

export const useLayers = (): LayersContextType => useContext(LayersContext);

export const LayersProvider = ({ children }: { children: React.ReactNode }) => {
	const [layers, setLayers] = useState(totalLayers);
	const [layersData, setLayersData] = useState<LayersData>(initialLayersData);
	const [isLayersDataLoaded, setIsLayersDataLoaded] = useState(false);

	// store layersData in ref to avoid re-rendering when it changes in useEffect
	const layersDataRef = useRef<LayersData>(layersData);
	useEffect(() => {
		const fetchLayersData = async () => {
			const dataEntries = await Promise.all(
				layers.map((layer) => {
					const hasLayerData = layersDataRef.current[layer.id].data !== null;
					const isLayerVisible = layers.find((l) => l.id === layer.id)?.visible;

					if (!isLayerVisible || hasLayerData) {
						return Promise.resolve([layer.id, layersDataRef.current[layer.id]]);
					}

					return getFetchLayerDataPromise(layer);
				}),
			);

			setLayersData(Object.fromEntries(dataEntries) as LayersData);
			setIsLayersDataLoaded(true);
		};

		fetchLayersData();
	}, [layers]);

	const toggleLayerVisibility = useCallback(
		(layerId: keyof typeof layerIds, visible: boolean) => {
			setLayers((prevLayers) =>
				prevLayers.map((layer) =>
					layer.id === layerId ? { ...layer, visible } : layer,
				),
			);
		},
		[],
	);

	return (
		<LayersContext.Provider
			value={{
				layers,
				setLayers,
				toggleLayerVisibility,
				layersData,
				setLayersData,
				isLayersDataLoaded,
			}}
		>
			<LayersDataRefProvider dataRef={layersDataRef}>
				{children}
			</LayersDataRefProvider>
		</LayersContext.Provider>
	);
};
