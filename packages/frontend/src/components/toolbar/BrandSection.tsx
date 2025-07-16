import React, {useState} from "react";
import packageJson from "../../../package.json";
import {Copy, Settings, Key, User} from "lucide-react";

interface BrandSectionProps {
	onCopy: () => void;
	onSettings?: () => void;
	onAuthManage?: () => void;
}

export const BrandSection: React.FC<BrandSectionProps> = ({onCopy, onSettings}) => {
	return (
		<>
			{/* 品牌标题栏 */}
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
							{onSettings && (
								<button
									onClick={onSettings}
									className="inline-flex items-center justify-center w-10 h-10 bg-transparent border border-[#87867F] text-[#181818] rounded-xl transition-all hover:bg-[#F0EEE6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#87867F]"
								>
									<Settings className="h-4 w-4"/>
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* 悬浮复制按钮 */}
			<button
				onClick={onCopy}
				className="fixed top-4 right-4 z-50 inline-flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm border border-[#E8E6DC] text-[#87867F] rounded-xl shadow-sm transition-all hover:bg-[#D97757] hover:text-white hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:ring-offset-2"
				title="复制内容"
			>
				<Copy className="h-4 w-4"/>
			</button>
		</>
	);
};
