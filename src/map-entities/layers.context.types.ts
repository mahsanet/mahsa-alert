import type { LocationDataType } from "../types";
import type { layerIds } from "./layers";

export type LayersData = Record<
	keyof typeof layerIds,
	{
		data: LocationDataType | null;
		iconImage: ImageBitmap | null;
	}
>;
