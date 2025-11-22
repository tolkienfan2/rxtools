import React, { useState, useRef, useEffect } from "react";
import { ImageProcessingService, Point } from "../services/ImageProcessingService";

export const PillCounter: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [processingService] = useState(new ImageProcessingService());

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImageSrc(event.target.result as string);
                    setPoints([]); // Reset points for new image
                }
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (imageSrc && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                drawPoints();

                // Auto-process
                setIsProcessing(true);
                processingService.processImage(imageSrc).then((detectedPoints) => {
                    setPoints(detectedPoints);
                    setIsProcessing(false);
                });
            };
            img.src = imageSrc;
        }
    }, [imageSrc]);

    useEffect(() => {
        drawPoints();
    }, [points]);

    const drawPoints = () => {
        if (!canvasRef.current || !imageSrc) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Redraw image first to clear previous points
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);

            // Draw points
            ctx.fillStyle = "red";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;

            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            });
        };
        img.src = imageSrc;
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check if clicking on existing point to remove it
        const clickRadius = 20;
        const existingPointIndex = points.findIndex(p =>
            Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < clickRadius
        );

        if (existingPointIndex >= 0) {
            const newPoints = [...points];
            newPoints.splice(existingPointIndex, 1);
            setPoints(newPoints);
        } else {
            setPoints([...points, { x, y }]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6 sm:px-12">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-blue-600">Pill Counter</h1>
                <p className="mt-4 text-gray-600">Upload an image to count pills. Click to add/remove markers.</p>
            </header>

            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <div className="mb-6 text-center">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                </div>

                {isProcessing && <p className="text-center text-blue-500 font-semibold">Processing image...</p>}

                <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 min-h-[400px] flex items-center justify-center">
                    {imageSrc ? (
                        <canvas
                            ref={canvasRef}
                            onClick={handleCanvasClick}
                            className="max-w-full h-auto cursor-crosshair"
                            style={{ maxHeight: '70vh' }}
                        />
                    ) : (
                        <p className="text-gray-400">No image uploaded</p>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-800">
                        Count: <span className="text-blue-600">{points.length}</span>
                    </h2>
                </div>
            </div>
        </div>
    );
};