export interface Point {
    x: number;
    y: number;
}

export interface Blob {
    size: number;
    center: Point;
    pixels: Point[]; // Optional: might be useful for precise clicking, but center + radius is usually enough.
    // Actually, let's keep it simple for now.
}

export class ImageProcessingService {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
    }

    public async processImage(imageUrl: string): Promise<{ blobs: Blob[], defaultReferenceSize: number }> {
        const img = await this.loadImage(imageUrl);
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const binary = this.thresholdImage(imageData);
        const blobs = this.findBlobs(binary, this.canvas.width, this.canvas.height);

        // Calculate default reference size (Mode)
        const defaultReferenceSize = this.calculateModeSize(blobs);

        return { blobs, defaultReferenceSize };
    }

    public calculatePoints(blobs: Blob[], referenceSize: number): Point[] {
        const points: Point[] = [];
        if (referenceSize <= 0) return blobs.map(b => b.center);

        blobs.forEach(blob => {
            let count = Math.round(blob.size / referenceSize);
            if (count < 1) count = 1;

            if (count === 1) {
                points.push(blob.center);
            } else {
                // Distribute points based on blob size
                const blobRadius = Math.sqrt(blob.size / Math.PI);
                const distributionRadius = blobRadius * 0.6; // Place points at 60% of radius

                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * 2 * Math.PI;
                    points.push({
                        x: blob.center.x + distributionRadius * Math.cos(angle),
                        y: blob.center.y + distributionRadius * Math.sin(angle)
                    });
                }
            }
        });
        return points;
    }

    private calculateModeSize(blobs: Blob[]): number {
        if (blobs.length === 0) return 0;

        // Dynamic bucket size based on average blob size to handle high-res images
        const avgSize = blobs.reduce((sum, b) => sum + b.size, 0) / blobs.length;
        const bucketSize = Math.max(50, Math.floor(avgSize / 20)); // e.g., if avg is 5000, bucket is 250

        const histogram = new Map<number, number>();
        let maxFrequency = 0;
        let modeSize = 0;

        blobs.forEach(blob => {
            const bucket = Math.floor(blob.size / bucketSize) * bucketSize;
            const count = (histogram.get(bucket) || 0) + 1;
            histogram.set(bucket, count);

            if (count > maxFrequency) {
                maxFrequency = count;
                modeSize = bucket + (bucketSize / 2);
            }
        });

        // Fallback to median
        if (modeSize === 0) {
            const sortedSizes = blobs.map(b => b.size).sort((a, b) => a - b);
            modeSize = sortedSizes[Math.floor(sortedSizes.length / 2)];
        }

        return modeSize;
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    private thresholdImage(imageData: ImageData): Uint8ClampedArray {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const binary = new Uint8ClampedArray(width * height);
        const grays = new Uint8Array(width * height);

        // 1. Convert to Grayscale
        for (let i = 0; i < data.length; i += 4) {
            const avg = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            grays[i / 4] = avg;
        }

        // 1b. Gaussian Blur to reduce noise
        const blurred = this.gaussianBlur(grays, width, height);

        // 2. Otsu's Method to find optimal threshold
        const threshold = this.getOtsuThreshold(blurred);

        // 3. Create Binary Map
        let backgroundIsLight = 0;

        // Sample more border pixels
        for (let x = 0; x < width; x += 10) {
            if (blurred[x] > threshold) backgroundIsLight++; else backgroundIsLight--;
            if (blurred[width * (height - 1) + x] > threshold) backgroundIsLight++; else backgroundIsLight--;
        }
        for (let y = 0; y < height; y += 10) {
            if (blurred[y * width] > threshold) backgroundIsLight++; else backgroundIsLight--;
            if (blurred[y * width + width - 1] > threshold) backgroundIsLight++; else backgroundIsLight--;
        }

        const invert = backgroundIsLight > 0;

        for (let i = 0; i < blurred.length; i++) {
            if (invert) {
                binary[i] = blurred[i] <= threshold ? 1 : 0;
            } else {
                binary[i] = blurred[i] > threshold ? 1 : 0;
            }
        }

        // 4. Erode to separate touching pills (Single pass)
        const eroded = this.erode(binary, width, height);

        return eroded;
    }

    private erode(binary: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
        const eroded = new Uint8ClampedArray(binary.length);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                if (binary[idx] === 1) {
                    if (binary[idx - 1] === 1 && binary[idx + 1] === 1 && binary[idx - width] === 1 && binary[idx + width] === 1) {
                        eroded[idx] = 1;
                    } else {
                        eroded[idx] = 0;
                    }
                }
            }
        }
        return eroded;
    }

    private gaussianBlur(data: Uint8Array, width: number, height: number): Uint8Array {
        const output = new Uint8Array(data.length);
        // 3x3 Gaussian kernel approximation
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                let sum = 0;
                sum += data[idx - width - 1] * 1;
                sum += data[idx - width] * 2;
                sum += data[idx - width + 1] * 1;
                sum += data[idx - 1] * 2;
                sum += data[idx] * 4;
                sum += data[idx + 1] * 2;
                sum += data[idx + width - 1] * 1;
                sum += data[idx + width] * 2;
                sum += data[idx + width + 1] * 1;
                output[idx] = sum / 16;
            }
        }
        return output;
    }

    private getOtsuThreshold(grays: Uint8Array): number {
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < grays.length; i++) {
            histogram[grays[i]]++;
        }
        let total = grays.length;
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * histogram[i];
        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVar = 0;
        let threshold = 0;
        for (let i = 0; i < 256; i++) {
            wB += histogram[i];
            if (wB === 0) continue;
            wF = total - wB;
            if (wF === 0) break;
            sumB += i * histogram[i];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const varBetween = wB * wF * (mB - mF) * (mB - mF);
            if (varBetween > maxVar) {
                maxVar = varBetween;
                threshold = i;
            }
        }
        return threshold;
    }

    private findBlobs(binary: Uint8ClampedArray, width: number, height: number): Blob[] {
        const visited = new Uint8Array(width * height);
        const blobs: Blob[] = [];

        // Dynamic minBlobSize based on image resolution
        // For 12MP (4000x3000), we want minSize ~2000.
        // For 0.3MP (640x480), we want minSize ~60.
        // Ratio: 1/6000 of total pixels seems reasonable.
        const minBlobSize = Math.max(50, (width * height) / 6000);
        const maxBlobSize = width * height * 0.5;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (binary[idx] === 1 && visited[idx] === 0) {
                    const blob = this.floodFill(binary, visited, width, height, x, y);
                    if (blob.size > minBlobSize && blob.size < maxBlobSize) {
                        blobs.push(blob);
                    }
                }
            }
        }
        return blobs;
    }

    private floodFill(binary: Uint8ClampedArray, visited: Uint8Array, width: number, height: number, startX: number, startY: number): Blob {
        const stack = [[startX, startY]];
        let size = 0;
        let sumX = 0;
        let sumY = 0;

        while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            const idx = y * width + x;

            if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] === 1 || binary[idx] === 0) {
                continue;
            }

            visited[idx] = 1;
            size++;
            sumX += x;
            sumY += y;

            if (x + 1 < width) stack.push([x + 1, y]);
            if (x - 1 >= 0) stack.push([x - 1, y]);
            if (y + 1 < height) stack.push([x, y + 1]);
            if (y - 1 >= 0) stack.push([x, y - 1]);
        }

        return {
            size,
            center: { x: sumX / size, y: sumY / size },
            pixels: [] // Not storing pixels for now to save memory
        };
    }
}
