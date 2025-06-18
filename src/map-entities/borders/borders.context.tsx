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
import { type Border, type borderIds, totalBorders } from "./borders";
import { BordersDataRefProvider } from "./borders.context.ref";
import type { BordersData } from "./borders.context.types";
import { getFetchBorderDataPromise, initialBordersData } from "./borders.utils";

interface BordersContextType {
	borders: Border[];
	setBorders: Dispatch<SetStateAction<Border[]>>;
	bordersData: BordersData;
	setBordersData: Dispatch<SetStateAction<BordersData>>;
	toggleBorderVisibility: (
		borderId: keyof typeof borderIds,
		visible: boolean,
	) => void;
	isBordersDataLoaded: boolean;
}

const BordersContext = createContext<BordersContextType>({
	borders: totalBorders,
	setBorders: () => {},
	bordersData: initialBordersData,
	setBordersData: () => {},
	toggleBorderVisibility: () => {},
	isBordersDataLoaded: false,
});

export const useBorders = (): BordersContextType => useContext(BordersContext);

export const BordersProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [borders, setBorders] = useState(totalBorders);
	const [bordersData, setBordersData] =
		useState<BordersData>(initialBordersData);
	const [isBordersDataLoaded, setIsBordersDataLoaded] = useState(false);

	// store bordersData in ref to avoid re-rendering when it changes in useEffect
	const bordersDataRef = useRef<BordersData>(bordersData);
	useEffect(() => {
		const fetchLayersData = async () => {
			const dataEntries = await Promise.all(
				borders.map((border) => {
					const hasBorderData = bordersDataRef.current[border.id].data !== null;
					const isBorderVisible = borders.find(
						(b) => b.id === border.id,
					)?.visible;

					if (!isBorderVisible || hasBorderData) {
						return Promise.resolve([
							border.id,
							bordersDataRef.current[border.id],
						]);
					}

					return getFetchBorderDataPromise(border);
				}),
			);

			setBordersData(Object.fromEntries(dataEntries) as BordersData);
			setIsBordersDataLoaded(true);
		};

		fetchLayersData();
	}, [borders]);

	const toggleBorderVisibility = useCallback(
		(borderId: keyof typeof borderIds, visible: boolean) => {
			setBorders((prevBorders) =>
				prevBorders.map((border) =>
					border.id === borderId ? { ...border, visible } : border,
				),
			);
		},
		[],
	);

	return (
		<BordersContext.Provider
			value={{
				borders,
				setBorders,
				toggleBorderVisibility,
				bordersData,
				setBordersData,
				isBordersDataLoaded,
			}}
		>
			<BordersDataRefProvider dataRef={bordersDataRef}>
				{children}
			</BordersDataRefProvider>
		</BordersContext.Provider>
	);
};
