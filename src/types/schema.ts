export type Strike = {
	id: string;
	type: "Feature";
	geometry: {
		type: "Point";
		coordinates: [number, number]; // [longitude, latitude]
	};
	properties: {
		date: string;
		siteTargeted: string;
		status: string;
		threatLevel: "low" | "medium" | "high" | "critical";
	};
	createdAt: Date;
};

export type TokenInfo = {
	id: string;
	token: string;
	createdAt: {
		seconds: number;
		nanoseconds: number;
	};
	browser: {
		userAgent: string;
		platform: string;
		language: string;
		vendor: string;
	};
};
