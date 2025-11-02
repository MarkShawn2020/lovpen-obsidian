import React, {useState} from "react";
import packageJson from "../../../package.json";
import {Copy, Key, Settings} from "lucide-react";
import {AvatarConfig} from "../../types";
import {Avatar, AvatarFallback, AvatarImage} from "../ui/avatar";

interface BrandSectionProps {
	onCopy: () => void;
	onSettings?: () => void;
	onAuthManage?: () => void;
	avatarConfig?: AvatarConfig;
	userName?: string;
}


export const BrandSection: React.FC<BrandSectionProps> = ({
															  onCopy,
															  onSettings,
															  onAuthManage,
															  avatarConfig,
															  userName
														  }) => {
	const [showDropdown, setShowDropdown] = useState(false);

	return (
		<>
			{/* 品牌标题栏 */}
			<div className="bg-[#F9F9F7] border-b border-[#E8E6DC]">
				<div className="px-3 sm:px-6 py-4">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
							<div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
								<svg viewBox="0 0 986.05 1080" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
									<g fill="#D97757">
										<path d="M281.73,892.18V281.73C281.73,126.13,155.6,0,0,0l0,0v610.44C0,766.04,126.13,892.18,281.73,892.18z"/>
										<path d="M633.91,1080V469.56c0-155.6-126.13-281.73-281.73-281.73l0,0v610.44C352.14,953.87,478.31,1080,633.91,1080L633.91,1080z"/>
										<path d="M704.32,91.16L704.32,91.16v563.47l0,0c155.6,0,281.73-126.13,281.73-281.73S859.92,91.16,704.32,91.16z"/>
									</g>
								</svg>
							</div>
							<div className="flex items-center gap-2 min-w-0">
								<h1 className="text-lg sm:text-xl font-semibold text-[#181818] tracking-tight truncate">Lovpen</h1>
								<span
									className="bg-[#F0EEE6] text-[#87867F] text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
									v{packageJson.version}
								</span>
							</div>
						</div>

						<div className="relative flex-shrink-0">
							<Avatar


								onClick={() => setShowDropdown(!showDropdown)}
									className="cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D97757] shadow-sm"

							>
								<AvatarImage/>
								<AvatarFallback
									className="transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 text-[#D97757] shadow-sm"
								>
									{userName?.[0] ?? "L"}
								</AvatarFallback>
							</Avatar>

							{/* 下拉菜单 */}
							{showDropdown && (
								<div
									className="absolute top-12 right-0 w-48 bg-white border border-[#E8E6DC] rounded-xl shadow-lg z-50 py-2">
									<div className="px-3 py-2 border-b border-[#F0EEE6]">
										<p className="text-xs text-[#87867F] font-medium">用户设置</p>
									</div>

									{onSettings && (
										<button
											onClick={() => {
												onSettings();
												setShowDropdown(false);
											}}
											className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#181818] hover:bg-[#F7F4EC] transition-colors"
										>
											<Settings className="h-4 w-4 text-[#87867F]"/>
											<span>应用设置</span>
										</button>
									)}

									{onAuthManage && (
										<button
											onClick={() => {
												onAuthManage();
												setShowDropdown(false);
											}}
											className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#181818] hover:bg-[#F7F4EC] transition-colors"
										>
											<Key className="h-4 w-4 text-[#87867F]"/>
											<span>Auth 管理</span>
										</button>
									)}
								</div>
							)}

							{/* 点击外部关闭下拉菜单 */}
							{showDropdown && (
								<div
									className="fixed inset-0 z-40"
									onClick={() => setShowDropdown(false)}
								/>
							)}
						</div>
					</div>
				</div>
			</div>

		</>
	);
};
