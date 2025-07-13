import React, {useCallback, useState} from 'react';
import Cropper from 'react-easy-crop';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {Check, Crop, X} from 'lucide-react';

export interface CropArea {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface AspectRatio {
	value: number;
	label: string;
	width: number;
	height: number;
}

interface ImageCropModalProps {
	isOpen: boolean;
	onClose: () => void;
	imageUrl: string;
	onCropComplete: (croppedImageUrl: string, cropArea: CropArea) => void;
	title?: string;
}

const ASPECT_RATIOS: AspectRatio[] = [
	{value: 2.25, label: '公众号封面', width: 900, height: 400},
	{value: 1, label: '正方形', width: 400, height: 400},
];

const createImage = (url: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.addEventListener('error', error => reject(error));
		image.setAttribute('crossOrigin', 'anonymous');
		image.src = url;
	});

const getCroppedImg = async (
	imageSrc: string,
	pixelCrop: CropArea,
	targetWidth: number,
	targetHeight: number
): Promise<string> => {
	const image = await createImage(imageSrc);
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('No 2d context');
	}

	canvas.width = targetWidth;
	canvas.height = targetHeight;

	ctx.drawImage(
		image,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		targetWidth,
		targetHeight
	);

	return new Promise((resolve) => {
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(URL.createObjectURL(blob));
			}
		}, 'image/jpeg', 0.95);
	});
};

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
																  isOpen,
																  onClose,
																  imageUrl,
																  onCropComplete,
																  title = '裁切图片'
															  }) => {
	const [crop, setCrop] = useState({x: 0, y: 0});
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
	const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
	const [isProcessing, setIsProcessing] = useState(false);

	const onCropChange = useCallback((crop: { x: number; y: number }) => {
		setCrop(crop);
	}, []);

	const onZoomChange = useCallback((zoom: number) => {
		setZoom(zoom);
	}, []);

	const onCropCompleteCallback = useCallback(
		(croppedArea: any, croppedAreaPixels: CropArea) => {
			setCroppedAreaPixels(croppedAreaPixels);
		},
		[]
	);

	const handleCropConfirm = useCallback(async () => {
		if (!croppedAreaPixels) return;

		setIsProcessing(true);
		try {
			const croppedImageUrl = await getCroppedImg(
				imageUrl,
				croppedAreaPixels,
				selectedAspectRatio.width,
				selectedAspectRatio.height
			);
			onCropComplete(croppedImageUrl, croppedAreaPixels);
			onClose();
		} catch (error) {
			console.error('裁切图片失败:', error);
		} finally {
			setIsProcessing(false);
		}
	}, [croppedAreaPixels, imageUrl, selectedAspectRatio, onCropComplete, onClose]);

	const handleClose = useCallback(() => {
		if (!isProcessing) {
			onClose();
		}
	}, [isProcessing, onClose]);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0">
				<DialogHeader className="px-6 py-4 border-b">
					<DialogTitle className="flex items-center gap-2 text-lg font-semibold">
						<Crop className="h-5 w-5"/>
						{title}
					</DialogTitle>
				</DialogHeader>

				<div className="flex-1 flex flex-col overflow-hidden">
					{/* 比例选择器 */}
					<div className="px-6 py-3 border-b bg-gray-50/50">
						<div className="flex flex-wrap gap-2">
							{ASPECT_RATIOS.map((ratio) => (
								<Badge
									key={ratio.value}
									variant={selectedAspectRatio.value === ratio.value ? "default" : "outline"}
									className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-1"
									onClick={() => setSelectedAspectRatio(ratio)}
								>
									{ratio.label} ({ratio.width}×{ratio.height})
								</Badge>
							))}
						</div>
					</div>

					{/* 裁切区域 */}
					<div className="flex-1 relative bg-black">
						<Cropper
							image={imageUrl}
							crop={crop}
							zoom={zoom}
							aspect={selectedAspectRatio.value}
							onCropChange={onCropChange}
							onZoomChange={onZoomChange}
							onCropComplete={onCropCompleteCallback}
							style={{
								containerStyle: {
									width: '100%',
									height: '100%',
								},
							}}
						/>
					</div>

					{/* 缩放控制 */}
					<div className="px-6 py-3 border-t bg-gray-50/50">
						<div className="flex items-center gap-3">
							<span className="text-xs text-gray-600 font-medium">缩放:</span>
							<input
								type="range"
								min={1}
								max={3}
								step={0.1}
								value={zoom}
								onChange={(e) => setZoom(Number(e.target.value))}
								className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
							/>
							<span className="text-xs text-gray-600 min-w-[3rem]">
                {Math.round(zoom * 100)}%
              </span>
						</div>
					</div>
				</div>

				<Separator/>

				{/* 操作按钮 */}
				<div className="px-6 py-4 flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isProcessing}
						className="min-w-[5rem]"
					>
						<X className="h-4 w-4 mr-1"/>
						取消
					</Button>
					<Button
						onClick={handleCropConfirm}
						disabled={!croppedAreaPixels || isProcessing}
						className="min-w-[5rem]"
					>
						<Check className="h-4 w-4 mr-1"/>
						{isProcessing ? '处理中...' : '确认裁切'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
