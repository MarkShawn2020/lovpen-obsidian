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
				<div className="px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 bg-[#D97757] rounded-xl flex items-center justify-center">
								<span className="text-white font-medium text-lg">O</span>
							</div>
							<div className="flex items-center gap-2">
								<h1 className="text-xl font-semibold text-[#181818] tracking-tight">Lovpen</h1>
								<span
									className="bg-[#F0EEE6] text-[#87867F] text-xs font-medium px-2 py-1 rounded-full">
									v{packageJson.version}
								</span>
							</div>
						</div>

						<div className="relative">
							<Avatar


								onClick={() => setShowDropdown(!showDropdown)}
									className="transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D97757] shadow-sm"

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
