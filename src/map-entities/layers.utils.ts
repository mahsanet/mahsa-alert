import type { LocationDataType } from "../types";
import { loadPngAsImage } from "../utils/loadPngAsImage";
import { type Layer, type layerIds, totalLayers } from "./layers";
import type { LayersData } from "./layers.context.types";

export const initialLayersData = Object.fromEntries(
	totalLayers.map((layer) => [layer.id, { data: null, iconImage: null }]),
) as LayersData;

const processResult = async (layer: Layer, res: Response) =>
	[
		layer.id,
		{
			data: (await res.json()) as LocationDataType,
			iconImage: await loadLayerImage(layer),
		},
	] as [
		keyof typeof layerIds,
		{ data: LocationDataType; iconImage: ImageBitmap | null },
	];

export const getFetchLayerDataPromise = (
	layer: Layer,
): Promise<
	[
		keyof typeof layerIds,
		{ data: LocationDataType | null; iconImage: ImageBitmap | null },
	]
> => {
	return fetch(layer.source.path)
		.then(async (res) => processResult(layer, res))
		.catch(() => {
			// retry once if the first fetch fails
			return fetch(layer.source.path)
				.then(async (res) => processResult(layer, res))
				.catch(() => {
					console.error(`Failed to fetch layer data for ${layer.id}`);

					return [
						layer.id,
						{
							data: null,
							iconImage: null,
						},
					] as [
						keyof typeof layerIds,
						{ data: null; iconImage: ImageBitmap | null },
					];
				});
		});
};

const loadLayerImage = async (layer: Layer): Promise<ImageBitmap | null> => {
	if (!layer.icon?.path) {
		return null;
	}

	const image = await loadPngAsImage(layer.icon.path);
	if (image) {
		return image;
	}

	return null;
};
