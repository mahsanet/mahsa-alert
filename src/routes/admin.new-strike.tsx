import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addDoc, collection } from "firebase/firestore";
import { useId, useState } from "react";
import { db } from "@/firebase";
import type { Strike } from "@/types/schema";

export const Route = createFileRoute("/admin/new-strike")({
	component: RouteComponent,
});

function RouteComponent() {
	const siteTargetedId = useId();
	const dateId = useId();
	const statusId = useId();
	const threatLevelId = useId();
	const longitudeId = useId();
	const latitudeId = useId();
	const navigate = useNavigate();

	const [formData, setFormData] = useState({
		siteTargeted: "",
		date: "",
		status: "",
		threatLevel: "",
		longitude: "",
		latitude: "",
	});

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const addStrike = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const strikeData: Omit<Strike, "id"> = {
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [Number(formData.longitude), Number(formData.latitude)],
				},
				properties: {
					date: formData.date,
					siteTargeted: formData.siteTargeted,
					status: formData.status,
					threatLevel:
						formData.threatLevel as Strike["properties"]["threatLevel"],
				},
				createdAt: new Date(),
			};

			await addDoc(collection(db, "strikes"), strikeData).then(() => {
				setFormData({
					siteTargeted: "",
					date: "",
					status: "",
					threatLevel: "",
					longitude: "",
					latitude: "",
				});
				navigate({ to: "/admin/strikes" });
			});
		} catch (error) {
			console.error("Error adding strike:", error);
		}
	};

	return (
		<div className="max-w-2xl mx-auto">
			<h1 className="text-2xl font-semibold mb-6">Create New Strike</h1>
			<form onSubmit={addStrike} className="space-y-4">
				<div>
					<label
						htmlFor={siteTargetedId}
						className="block text-sm font-medium mb-1"
					>
						Site Targeted
					</label>
					<input
						id={siteTargetedId}
						name="siteTargeted"
						type="text"
						value={formData.siteTargeted}
						onChange={handleChange}
						className="w-full rounded border p-2"
						placeholder="Enter target site name"
						required
					/>
				</div>

				<div>
					<label htmlFor={dateId} className="block text-sm font-medium mb-1">
						Date
					</label>
					<input
						id={dateId}
						name="date"
						type="date"
						value={formData.date}
						onChange={handleChange}
						className="w-full rounded border p-2"
						required
					/>
				</div>

				<div>
					<label htmlFor={statusId} className="block text-sm font-medium mb-1">
						Status
					</label>
					<input
						id={statusId}
						name="status"
						type="text"
						value={formData.status}
						onChange={handleChange}
						className="w-full rounded border p-2"
						placeholder="Enter strike status"
						required
					/>
				</div>

				<div>
					<label
						htmlFor={threatLevelId}
						className="block text-sm font-medium mb-1"
					>
						Threat Level
					</label>
					<select
						id={threatLevelId}
						name="threatLevel"
						value={formData.threatLevel}
						onChange={handleChange}
						className="w-full rounded border p-2"
						required
					>
						<option value="">Select threat level</option>
						<option value="low">Low</option>
						<option value="medium">Medium</option>
						<option value="high">High</option>
						<option value="critical">Critical</option>
					</select>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor={longitudeId}
							className="block text-sm font-medium mb-1"
						>
							Longitude
						</label>
						<input
							id={longitudeId}
							name="longitude"
							type="number"
							step="any"
							value={formData.longitude}
							onChange={handleChange}
							className="w-full rounded border p-2"
							placeholder="Enter longitude"
							required
						/>
					</div>
					<div>
						<label
							htmlFor={latitudeId}
							className="block text-sm font-medium mb-1"
						>
							Latitude
						</label>
						<input
							id={latitudeId}
							name="latitude"
							type="number"
							step="any"
							value={formData.latitude}
							onChange={handleChange}
							className="w-full rounded border p-2"
							placeholder="Enter latitude"
							required
						/>
					</div>
				</div>

				<button
					type="submit"
					className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
				>
					Create Strike
				</button>
			</form>
		</div>
	);
}
