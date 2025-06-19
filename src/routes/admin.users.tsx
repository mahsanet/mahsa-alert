import { createFileRoute } from "@tanstack/react-router";
import { collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "@/firebase";
import type { TokenInfo } from "@/types/schema";

export const Route = createFileRoute("/admin/users")({
	component: RouteComponent,
});

function RouteComponent() {
	const [tokens, setTokens] = useState<TokenInfo[]>([]);

	const fetchTokens = useCallback(async () => {
		const snapshot = await getDocs(collection(db, "tokens"));
		const data = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as TokenInfo[];
		setTokens(data);
	}, []);

	useEffect(() => {
		fetchTokens();
	}, [fetchTokens]);

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Registered Devices</h1>
				<div className="text-sm text-gray-500">
					Total Devices: {tokens.length}
				</div>
			</div>

			<div className="rounded-lg border shadow-sm overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-muted/50">
						<tr className="border-b">
							<th className="h-12 px-4 text-left align-middle font-medium">
								Registration Date
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Platform
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Browser
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Language
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Token Preview
							</th>
						</tr>
					</thead>
					<tbody>
						{tokens.map((token) => {
							const date = new Date(token.createdAt.seconds * 1000);
							const tokenPreview = `${token.token.slice(0, 20)}...`;

							return (
								<tr key={token.id} className="border-b">
									<td className="p-4">
										{date.toLocaleDateString()} {date.toLocaleTimeString()}
									</td>
									<td className="p-4">
										<div className="font-medium">{token.browser.platform}</div>
										<div className="text-xs text-gray-500">
											{token.browser.vendor}
										</div>
									</td>
									<td className="p-4">
										<div className="max-w-md overflow-hidden text-ellipsis">
											{token.browser.userAgent}
										</div>
									</td>
									<td className="p-4">{token.browser.language}</td>
									<td className="p-4">
										<div className="font-mono text-xs">{tokenPreview}</div>
									</td>
								</tr>
							);
						})}
						{tokens.length === 0 && (
							<tr>
								<td
									colSpan={5}
									className="p-8 text-center text-muted-foreground"
								>
									No registered devices found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
