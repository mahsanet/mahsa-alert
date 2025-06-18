import type { LocationDataType } from "../types";
import type { BordersData } from "./border.context.types";
import { type Border, type borderIds, totalBorders } from "./borders";

export const initialBordersData = Object.fromEntries(
	totalBorders.map((border) => [border.id, { data: null }]),
) as BordersData;

const processResult = async (border: Border, res: Response) =>
	[
		border.id,
		{
			data: (await res.json()) as LocationDataType,
		},
	] as [
		keyof typeof borderIds,
		{ data: LocationDataType; iconImage: ImageBitmap | null },
	];

export const getFetchBorderDataPromise = (
	border: Border,
): Promise<
	[
		keyof typeof borderIds,
		{ data: LocationDataType | null; iconImage: ImageBitmap | null },
	]
> => {
	return fetch(border.source.path)
		.then(async (res) => processResult(border, res))
		.catch(() => {
			// retry once if the first fetch fails
			return fetch(border.source.path)
				.then(async (res) => processResult(border, res))
				.catch(() => {
					console.error(`Failed to fetch border data for ${border.id}`);

					return [
						border.id,
						{
							data: null,
							iconImage: null,
						},
					] as [
						keyof typeof borderIds,
						{ data: null; iconImage: ImageBitmap | null },
					];
				});
		});
};
