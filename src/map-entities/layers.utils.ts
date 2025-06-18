import type { LocationDataType } from "../types";
import { loadPngAsImage } from "../utils/loadPngAsImage";
import { type Layer, type layerIds, totalLayers } from "./layers";
import type { LayersData } from "./layers.context.types";

const maxDelay = 2000;
const retryLimit = 5;
let retryCount = 0;

export const initialLayersData = Object.fromEntries(
	totalLayers.map((layer) => [layer.id, { data: null, iconImage: null }]),
) as LayersData;

export async function getFetchLayerDataPromise(
	layer: Layer,
): Promise<
	[
		keyof typeof layerIds,
		{ data: LocationDataType | null; iconImage: ImageBitmap | null },
	]
> {
	return fetch(layer.source.path)
		.then(async (res) => processResult(layer, res))
		.then((result) => {
			retryCount = retryLimit;

			return result;
		})
		.catch(async (error) => {
			if (retryCount < retryLimit) {
				retryCount++;

				const delay = Math.min(500 * retryCount, maxDelay);
				await new Promise((resolve) => setTimeout(resolve, delay));

				return getFetchLayerDataPromise(layer);
			}

			console.error(`Failed to fetch layer data for ${layer.id}: ${error}`);

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
}

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
