export async function loadPngAsImage(url: string): Promise<ImageBitmap | null> {
	return fetch(url)
		.then((res) => res.blob())
		.then((blob) => createImageBitmap(blob))
		.catch((err) => {
			console.error(err);

			return null;
		});
}
