import type { LocationDataType } from "@/types";
import { type Border, type borderIds, totalBorders } from "./borders";
import type { BordersData } from "./borders.context.types";

export const initialBordersData = Object.fromEntries(
	totalBorders.map((border) => [border.id, { data: null }]),
) as BordersData;

const maxDelay = 2000;
const retryLimit = 5;
let retryCount = 0;

export async function getFetchBorderDataPromise(
	border: Border,
): Promise<
	[
		keyof typeof borderIds,
		{ data: LocationDataType | null; iconImage: ImageBitmap | null },
	]
> {
	return fetch(border.source.path)
		.then(async (res) => processResult(border, res))
		.then((result) => {
			retryCount = retryLimit;

			return result;
		})
		.catch(async (error) => {
			if (retryCount < retryLimit) {
				retryCount++;

				const delay = Math.min(500 * retryCount, maxDelay);
				await new Promise((resolve) => setTimeout(resolve, delay));

				return getFetchBorderDataPromise(border);
			}

			console.error(`Failed to fetch border data for ${border.id}: ${error}`);

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
}

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
