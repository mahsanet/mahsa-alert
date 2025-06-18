import {
	createContext,
	type Dispatch,
	type SetStateAction,
	useContext,
	useMemo,
	useState,
} from "react";
import { userLocationConfig } from "./user-location";

type UserLocation = {
	lat: number;
	lng: number;
};

export const UserLocationContext = createContext<{
	userLocationConfig: typeof userLocationConfig;
	userLocation: UserLocation;
	setUserLocation: Dispatch<SetStateAction<UserLocation>>;
	userLocationData: GeoJSON.FeatureCollection | null;
}>({
	userLocationConfig,
	userLocation: {
		lat: 0,
		lng: 0,
	},
	setUserLocation: () => {},
	userLocationData: null,
});

export const useUserLocation = () => {
	const context = useContext(UserLocationContext);
	if (!context) {
		throw new Error(
			"useUserLocation must be used within a UserLocationProvider",
		);
	}
	return context;
};

export const UserLocationProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [userLocation, setUserLocation] = useState<UserLocation>({
		lat: 0,
		lng: 0,
	});

	const userLocationData = useMemo<GeoJSON.FeatureCollection | null>(() => {
		if (!userLocation.lat || !userLocation.lng) return null;

		return {
			type: "FeatureCollection" as const,
			features: [
				{
					type: "Feature" as const,
					properties: {
						name: userLocationConfig.label,
						accuracy: userLocationConfig.accuracyLabel,
					},
					geometry: {
						type: "Point" as const,
						coordinates: [userLocation.lng, userLocation.lat],
					},
				},
			],
		} as GeoJSON.FeatureCollection;
	}, [userLocation]);

	return (
		<UserLocationContext.Provider
			value={{
				userLocationConfig,
				userLocation,
				setUserLocation,
				userLocationData,
			}}
		>
			{children}
		</UserLocationContext.Provider>
	);
};
