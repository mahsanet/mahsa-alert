import { createFileRoute, Link } from "@tanstack/react-router";
import { collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "@/firebase";
import type { Strike } from "@/types/schema";

export const Route = createFileRoute("/admin/strikes")({
	component: RouteComponent,
});

function RouteComponent() {
	const [strikes, setStrikes] = useState<Strike[]>([]);

	const fetchStrikes = useCallback(async () => {
		const snapshot = await getDocs(collection(db, "strikes"));
		const data = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as Strike[];
		setStrikes(data);
	}, []);

	useEffect(() => {
		fetchStrikes();
	}, [fetchStrikes]);

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Strikes</h1>
				<Link
					to="/admin/new-strike"
					className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
				>
					Create New Strike
				</Link>
			</div>

			<div className="rounded-lg border shadow-sm">
				<table className="w-full text-sm">
					<thead className="bg-muted/50">
						<tr className="border-b">
							<th className="h-12 px-4 text-left align-middle font-medium">
								Date
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Site Targeted
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Status
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Threat Level
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Coordinates
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{strikes.map((strike) => {
							return (
								<tr key={strike.id} className="border-b">
									<td className="p-4">{strike.properties.date}</td>
									<td className="p-4">{strike.properties.siteTargeted}</td>
									<td className="p-4">{strike.properties.status}</td>
									<td className="p-4">
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												{
													low: "bg-blue-100 text-blue-800",
													medium: "bg-yellow-100 text-yellow-800",
													high: "bg-orange-100 text-orange-800",
													critical: "bg-red-100 text-red-800",
												}[strike.properties.threatLevel]
											}`}
										>
											{strike.properties.threatLevel.charAt(0).toUpperCase() +
												strike.properties.threatLevel.slice(1)}
										</span>
									</td>
									<td className="p-4">
										{strike.geometry.coordinates[0].toFixed(4)},{" "}
										{strike.geometry.coordinates[1].toFixed(4)}
									</td>
									<td className="p-4">
										<button
											type="button"
											className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
										>
											Edit
										</button>
									</td>
								</tr>
							);
						})}
						{strikes.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="p-8 text-center text-muted-foreground"
								>
									No strikes found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
