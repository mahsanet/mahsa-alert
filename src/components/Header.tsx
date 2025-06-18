import type React from "react";

const Header: React.FC = () => {
	return (
		<div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-transparent backdrop-blur-sm">
			<div className="container mx-auto px-6 py-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="flex items-center justify-center w-12 h-12 shadow-lg">
							<img
								src="/assets/img/logo.jpeg"
								alt="logo"
								className="w-15 h-15 rounded-xl "
							/>
						</div>
						<div>
							<div className="flex items-center gap-5">
								<h1 className="text-2xl font-bold text-white">Mahsa Alert</h1>
								<span className="text-blue-300 text-sm">Beta</span>
							</div>

							<p className="text-blue-200 text-sm">©2025 MahsaNet</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Header;
