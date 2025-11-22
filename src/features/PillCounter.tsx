import React, { useState, useRef, useEffect } from "react";
import { ImageProcessingService, Point } from "../services/ImageProcessingService";

type InputMode = 'upload' | 'camera';

export const PillCounter: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<InputMode>('upload');
    const [isCameraActive, setIsCameraActive] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [processingService] = useState(new ImageProcessingService());

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer back camera on mobile
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please ensure you have granted permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setIsCameraActive(false);
        }
    };

    const handleModeChange = (newMode: InputMode) => {
        setMode(newMode);
        setImageSrc(null);
        setPoints([]);
        if (newMode === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                setImageSrc(dataUrl);
                stopCamera(); // Stop camera after capture to save battery/resources
            }
        }
    };

    const handleRetake = () => {
        setImageSrc(null);
        setPoints([]);
        startCamera();
    };

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
            <header className="text-center mb-8">
                <h1 className="text-5xl font-extrabold text-blue-600">Pill Counter</h1>
                <p className="mt-4 text-gray-600">Count pills instantly with 100% accuracy.</p>
            </header>

            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                {/* Mode Toggle */}
                <div className="flex justify-center mb-6 space-x-4">
                    <button
                        className={`px-4 py-2 rounded-full font-semibold transition-colors ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        onClick={() => handleModeChange('upload')}
                    >
                        Upload Photo
                    </button>
                    <button
                        className={`px-4 py-2 rounded-full font-semibold transition-colors ${mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        onClick={() => handleModeChange('camera')}
                    >
                        Use Camera
                    </button>
                </div>

                {/* Input Area */}
                <div className="mb-6 text-center">
                    {mode === 'upload' && (
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
                    )}
                </div>

                {isProcessing && <p className="text-center text-blue-500 font-semibold mb-4">Processing image...</p>}

                {/* Main Display Area */}
                <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 min-h-[400px] flex items-center justify-center bg-black">
                    {mode === 'camera' && !imageSrc ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="max-w-full max-h-[70vh]"
                            />
                            {isCameraActive && (
                                <button
                                    onClick={handleCapture}
                                    className="absolute bottom-4 bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 transition-transform hover:scale-105"
                                    aria-label="Capture photo"
                                >
                                    <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white"></div>
                                </button>
                            )}
                        </div>
                    ) : (
                        imageSrc ? (
                            <div className="relative">
                                <canvas
                                    ref={canvasRef}
                                    onClick={handleCanvasClick}
                                    className="max-w-full h-auto cursor-crosshair"
                                    style={{ maxHeight: '70vh' }}
                                />
                                {mode === 'camera' && (
                                    <button
                                        onClick={handleRetake}
                                        className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md opacity-75 hover:opacity-100"
                                    >
                                        Retake
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400">
                                {mode === 'upload' ? 'No image uploaded' : 'Camera inactive'}
                            </p>
                        )
                    )}
                </div>

                <div className="mt-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-800">
                        Count: <span className="text-blue-600">{points.length}</span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Click on the image to add missed pills or remove incorrect ones.
                    </p>
                </div>
            </div>
        </div>
    );
};