import type { LocationDataType } from "../types";
import type { borderIds } from "./borders";

export type BordersData = Record<
	keyof typeof borderIds,
	{
		data: LocationDataType | null;
	}
>;
