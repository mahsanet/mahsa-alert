import type React from "react";
import { useEffect, useState } from "react";

interface WarningProps {
	isVisible: boolean;
	onClose: () => void;
	isCompact?: boolean;
	onExpand?: () => void;
}

const Warning: React.FC<WarningProps> = ({
	isVisible,
	onClose,
	isCompact = false,
	onExpand,
}) => {
	const [shouldRender, setShouldRender] = useState(isVisible);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (isVisible) {
			setShouldRender(true);
			setTimeout(() => setIsAnimating(true), 10);
		} else {
			setIsAnimating(false);
			setTimeout(() => setShouldRender(false), 300);
		}
	}, [isVisible]);

	const handleBoxClick = () => {
		if (isCompact && onExpand) {
			onExpand();
		}
	};

	if (!shouldRender) return null;

	return (
		<>
			<style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes slideOutDown {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(100%);
          }
        }
        
        @keyframes expandHeight {
          from {
            max-height: 120px;
          }
          to {
            max-height: 400px;
          }
        }
        
        .warning-box-enter {
          animation: slideInUp 0.3s ease-out forwards;
        }
        
        .warning-box-exit {
          animation: slideOutDown 0.3s ease-in forwards;
        }
        
        .warning-box-expand {
          animation: expandHeight 0.4s ease-out forwards;
          overflow: hidden;
        }
      `}</style>

			<button
				type="button"
				className={`fixed font-vazirmatn z-40 
                   bottom-10 left-1/2 transform -translate-x-1/2
                   w-11/12 max-w-xs md:max-w-sm
									 cursor-default
                   bg-black/80 backdrop-blur-md rounded-xl shadow-2xl p-4 border border-gray-600 rtl space-y-4
                   transition-all duration-300 ease-out
                   ${isAnimating ? "warning-box-enter" : "warning-box-exit"}
                   ${isCompact ? "cursor-pointer hover:bg-black/90" : ""}
                   ${!isCompact ? "warning-box-expand" : ""}`}
				onClick={handleBoxClick}
			>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
					className="absolute top-3 left-3 w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-10"
					aria-label="بستن"
				>
					<svg
						aria-hidden="true"
						className="w-4 h-4 text-gray-300"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>

				<div className="flex items-center space-x-2 mb-3 pr-6">
					<svg
						aria-hidden="true"
						className="w-6 h-6 text-red-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<h3 className="text-lg font-semibold text-red-400">هشدار امنیتی</h3>
					{isCompact && (
						<svg
							aria-hidden="true"
							className="w-4 h-4 text-gray-400 mr-auto"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					)}
				</div>

				<div className="space-y-3">
					<p className="text-sm text-gray-300">
						لطفاً از نزدیک شدن به مناطق مشخص شده خودداری کنید.
					</p>
				</div>

				{!isCompact && (
					<div className="transition-all duration-300 ease-out">
						<div className="border-t border-gray-600 pt-3">
							<div className="space-y-1">
								<p className="text-xs text-gray-400 leading-relaxed">
									<span className="font-medium">آخرین بروزرسانی:</span> ۱۶ ژوئن
									۲۰۲۵
								</p>
								<p className="text-xs text-gray-400 leading-relaxed">
									<span className="font-medium">منبع:</span>{" "}
									<a
										target="_blank"
										href="https://experience.arcgis.com/experience/c4af6932cb414a8197e0a6c12ea2b2b9"
										rel="noopener"
									>
										INSS Map
									</a>
								</p>
							</div>
						</div>
					</div>
				)}
			</button>
		</>
	);
};

export default Warning;
