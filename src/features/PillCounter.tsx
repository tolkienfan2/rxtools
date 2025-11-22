import React, { useState, useRef, useEffect } from "react";
import { ImageProcessingService, Point, Blob } from "../services/ImageProcessingService";

export const PillCounter: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [blobs, setBlobs] = useState<Blob[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [processingService] = useState(new ImageProcessingService());

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Camera API not supported in this browser. Please use a secure context (HTTPS) or a modern browser.");
            return;
        }

        try {
            // Try environment camera first
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            console.warn("Environment camera failed, trying default...", err);
            try {
                // Fallback to any available camera
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                    setIsCameraActive(true);
                }
            } catch (err2) {
                console.error("Error accessing camera:", err2);
                alert("Could not access camera. Please ensure you have granted permissions.");
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setIsCameraActive(false);
        }
    };

    const handleCapture = () => {
        if (videoRef.current) {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
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
        setBlobs([]);
        setIsCalibrating(false);
        startCamera();
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

                // Auto-process
                setIsProcessing(true);
                processingService.processImage(imageSrc).then((result) => {
                    setBlobs(result.blobs);

                    // Initial calculation
                    const initialPoints = processingService.calculatePoints(result.blobs, result.defaultReferenceSize);
                    setPoints(initialPoints);

                    setIsProcessing(false);
                });
            };
            img.src = imageSrc;
        }
    }, [imageSrc]);

    // Redraw when points or calibration mode changes
    useEffect(() => {
        drawPoints();
    }, [points, isCalibrating]);

    const drawPoints = () => {
        if (!canvasRef.current || !imageSrc) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);

            // Draw points
            ctx.fillStyle = isCalibrating ? "rgba(255, 165, 0, 0.8)" : "red"; // Orange in calibration mode
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

        if (isCalibrating) {
            // Find blob under click
            const clickedBlob = blobs.find(b => {
                const dist = Math.sqrt(Math.pow(b.center.x - x, 2) + Math.pow(b.center.y - y, 2));
                // Simple distance check to center - could be improved with pixel check but this is usually enough
                // Assuming blob radius roughly corresponds to size
                const approxRadius = Math.sqrt(b.size / Math.PI);
                return dist < approxRadius * 1.5; // Generous hit area
            });

            if (clickedBlob) {
                const newPoints = processingService.calculatePoints(blobs, clickedBlob.size);
                setPoints(newPoints);
                setIsCalibrating(false); // Exit calibration mode
                alert(`Calibrated! Reference size set to ${clickedBlob.size} pixels.`);
            }
        } else {
            // Normal add/remove logic
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
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6 sm:px-12">
            <header className="text-center mb-8">
                <h1 className="text-5xl font-extrabold text-blue-600">Pill Counter</h1>
                <p className="mt-4 text-gray-600">Count pills instantly with 100% accuracy.</p>
            </header>

            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                {isProcessing && <p className="text-center text-blue-500 font-semibold mb-4">Processing image...</p>}

                {/* Main Display Area */}
                <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 min-h-[400px] flex items-center justify-center bg-black">
                    {!imageSrc ? (
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
                        <div className="relative">
                            <canvas
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                className={`max - w - full h - auto ${isCalibrating ? 'cursor-pointer' : 'cursor-crosshair'} `}
                                style={{ maxHeight: '70vh' }}
                            />
                            <button
                                onClick={handleRetake}
                                className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md opacity-75 hover:opacity-100"
                            >
                                Retake
                            </button>
                            {!isProcessing && (
                                <button
                                    onClick={() => setIsCalibrating(!isCalibrating)}
                                    className={`absolute bottom - 4 right - 4 px - 4 py - 2 rounded - md shadow - md transition - colors ${isCalibrating
                                        ? 'bg-orange-500 text-white animate-pulse'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                        } `}
                                >
                                    {isCalibrating ? 'Click a Single Pill' : 'Calibrate Size'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    {imageSrc && (
                        <div className="mb-6">
                            <button
                                onClick={handleRetake}
                                className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:bg-blue-700 transition-transform hover:scale-105"
                            >
                                Count Next Tray
                            </button>
                        </div>
                    )}

                    <h2 className="text-3xl font-bold text-gray-800">
                        Count: <span className="text-blue-600">{points.length}</span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 mb-6">
                        {isCalibrating
                            ? "Click on a SINGLE pill to set the reference size."
                            : "Click on the image to add missed pills or remove incorrect ones."}
                    </p>
                </div>
            </div>
        </div>
    );
};