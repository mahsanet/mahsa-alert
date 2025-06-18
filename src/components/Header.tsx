import type React from "react";
import type { ReactNode } from "react";

const Header: React.FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<div className="fixed top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm md:max-w-lg">
			<div className="flex items-center w-full bg-black/80 backdrop-blur-md rounded-xl md:rounded-2xl px-4 py-3 md:px-3 md:py-4 text-white border border-gray-600 hover:bg-black/90 transition-colors">
				<img
					src="/assets/img/logo.jpeg"
					alt="logo"
					className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl"
				/>
				<h1 className="text-xl md:text-3xl font-bold text-white items-center mt-1 flex ml-2 md:ml-3">
					Mahsa Alert
					<span className="text-xs md:text-sm ml-1 md:ml-2">(beta)</span>
				</h1>

				{children}
			</div>
		</div>
	);
};

export default Header;
