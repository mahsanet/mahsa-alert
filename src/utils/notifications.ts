import { getToken, messaging } from "../firebase";

const VAPID_KEY = import.meta.env.VITE_VAPID_KEY;

export const requestNotificationPermission = async () => {
	console.log("determining a permission");
	const permission = await Notification.requestPermission();
	console.log({ permission });

	if (permission !== "granted") {
		throw new Error("Permission not granted for Notification");
	}

	const token = await getToken(messaging, { vapidKey: VAPID_KEY });
	console.log("FCM Token:", token);

	return token;
};
