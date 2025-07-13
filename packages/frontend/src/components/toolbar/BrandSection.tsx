import React from "react";
import packageJson from "../../../../package.json";
import {Copy, Settings, Upload} from "lucide-react";

interface BrandSectionProps {
	onCopy: () => void;
	onDistribute: () => void;
	onSettings?: () => void;
}

export const BrandSection: React.FC<BrandSectionProps> = ({onCopy, onDistribute, onSettings}) => {
	return (
		<div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-blue-500/20">
			<div className="px-6 py-4">
				<div className="flex items-center justify-between">
					{/* 品牌标识 */}
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
							<span className="text-white font-bold">O</span>
						</div>
						<div>
							<h1 className="text-xl font-bold text-white">Lovpen</h1>
							<span className="text-blue-100 text-xs">v{packageJson.version}</span>
						</div>
					</div>

					{/* 操作按钮 */}
					<div className="flex items-center gap-2">
						<button
							onClick={onCopy}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
						>
							<Copy className="h-4 w-4"/>
							<span className="text-sm">复制</span>
						</button>

						<button
							onClick={onDistribute}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
						>
							<Upload className="h-4 w-4"/>
							<span className="text-sm">分发</span>
						</button>

						{onSettings && (
							<button
								onClick={onSettings}
								className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
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
