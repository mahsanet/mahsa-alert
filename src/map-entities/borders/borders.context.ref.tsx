import { createContext, useContext, useRef } from "react";
import type { BordersData } from "./borders.context.types";
import { initialBordersData } from "./borders.utils";

export const BordersDataRefContext = createContext<
	React.MutableRefObject<BordersData>
>({
	current: initialBordersData,
});

export const useBordersDataRef = () => {
	return useContext(BordersDataRefContext);
};

export const BordersDataRefProvider = ({
	dataRef,
	children,
}: {
	dataRef: React.MutableRefObject<BordersData>;
	children: React.ReactNode;
}) => {
	const bordersDataRef = useRef<BordersData>(dataRef.current);

	return (
		<BordersDataRefContext.Provider value={bordersDataRef}>
			{children}
		</BordersDataRefContext.Provider>
	);
};
