import { createFileRoute } from "@tanstack/react-router";
import AdminLayout from "@/components/admin/AdminLayout";

declare module "@tanstack/react-router" {
	interface FileRoutesByPath {
		"/admin": {
			parentRoute: typeof import("./__root").Route;
		};
	}
}

export const Route = createFileRoute("/admin")({
	component: AdminLayout,
});
