import {CoverAspectRatio} from "@/components/toolbar/cover/types";

interface CoverData {
	id: string;
	imageUrl: string;
	aspectRatio: CoverAspectRatio;
	width: number;
	height: number;
	title?: string;
	description?: string;
	// 用于持久化恢复的字段
	originalImageUrl?: string; // 原始图片 URL（裁切前）
	originalFileName?: string; // 档案库来源的原始文件名
}

export type {CoverData};
