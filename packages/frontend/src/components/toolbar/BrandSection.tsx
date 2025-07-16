import React from "react";
import packageJson from "../../../package.json";
import {Copy, Settings, Upload} from "lucide-react";

interface BrandSectionProps {
	onCopy: () => void;
	onDistribute: () => void;
	onSettings?: () => void;
}

export const BrandSection: React.FC<BrandSectionProps> = ({onCopy, onDistribute, onSettings}) => {
	return (
		<div className="bg-[#F9F9F7] border-b border-[#E8E6DC]">
			<div className="px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="w-10 h-10 bg-[#D97757] rounded-xl flex items-center justify-center">
							<span className="text-white font-medium text-lg">O</span>
						</div>
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-semibold text-[#181818] tracking-tight">Lovpen</h1>
							<span className="bg-[#F0EEE6] text-[#87867F] text-xs font-medium px-2 py-1 rounded-full">
								v{packageJson.version}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={onCopy}
							className="inline-flex items-center gap-2 px-6 py-3 bg-[#D97757] text-white rounded-xl font-medium text-sm transition-all hover:bg-[#CC785C] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D97757]"
						>
							<Copy className="h-4 w-4"/>
							<span>复制</span>
						</button>

						<button
							onClick={onDistribute}
							className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-[#87867F] text-[#181818] rounded-xl font-medium text-sm transition-all hover:bg-[#F0EEE6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#87867F]"
						>
							<Upload className="h-4 w-4"/>
							<span>分发</span>
						</button>

						{onSettings && (
							<button
								onClick={onSettings}
								className="inline-flex items-center justify-center w-12 h-12 bg-transparent border border-[#87867F] text-[#181818] rounded-xl transition-all hover:bg-[#F0EEE6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#87867F]"
							>
								<Settings className="h-4 w-4"/>
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
