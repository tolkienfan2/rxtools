export interface Point {
    x: number;
    y: number;
}

export class ImageProcessingService {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
    }

    public async processImage(imageUrl: string): Promise<Point[]> {
        const img = await this.loadImage(imageUrl);
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const binary = this.thresholdImage(imageData);
        const blobs = this.findBlobs(binary, this.canvas.width, this.canvas.height);

        return blobs;
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
        // We need to determine if pills are lighter or darker than background.
        // Heuristic: Check the corners/borders. They are likely background.
        let backgroundIsLight = 0;
        // Sample corners of blurred image
        const borderPixels = [
            blurred[0], blurred[width - 1],
            blurred[width * (height - 1)], blurred[width * height - 1]
        ];
        // Sample more border pixels
        for (let x = 0; x < width; x += 10) {
            if (blurred[x] > threshold) backgroundIsLight++; else backgroundIsLight--;
            if (blurred[width * (height - 1) + x] > threshold) backgroundIsLight++; else backgroundIsLight--;
        }
        for (let y = 0; y < height; y += 10) {
            if (blurred[y * width] > threshold) backgroundIsLight++; else backgroundIsLight--;
            if (blurred[y * width + width - 1] > threshold) backgroundIsLight++; else backgroundIsLight--;
        }

        const invert = backgroundIsLight > 0; // If background is light (> threshold), we want dark pixels (<= threshold) to be 1 (objects)

        for (let i = 0; i < blurred.length; i++) {
            if (invert) {
                binary[i] = blurred[i] <= threshold ? 1 : 0;
            } else {
                binary[i] = blurred[i] > threshold ? 1 : 0;
            }
        }

        // 4. Erode to separate touching pills
        const eroded = this.erode(binary, width, height);

        return eroded;
    }

    private erode(binary: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
        const eroded = new Uint8ClampedArray(binary.length);
        // Simple 3x3 structural element (cross shape)
        //  0 1 0
        //  1 1 1
        //  0 1 0

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                if (binary[idx] === 1) {
                    // Check neighbors
                    if (binary[idx - 1] === 1 &&       // Left
                        binary[idx + 1] === 1 &&       // Right
                        binary[idx - width] === 1 &&   // Top
                        binary[idx + width] === 1) {   // Bottom
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
        // 1 2 1
        // 2 4 2
        // 1 2 1
        // Divisor = 16

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

    private findBlobs(binary: Uint8ClampedArray, width: number, height: number): Point[] {
        const visited = new Uint8Array(width * height);
        const blobs: Point[] = [];
        const minBlobSize = 150; // Increased from 30 to 150 to ignore noise
        const maxBlobSize = width * height * 0.5; // Ignore massive blobs (likely background errors)

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (binary[idx] === 1 && visited[idx] === 0) {
                    const { size, center } = this.floodFill(binary, visited, width, height, x, y);
                    if (size > minBlobSize && size < maxBlobSize) {
                        blobs.push(center);
                    }
                }
            }
        }
        return blobs;
    }

    private floodFill(binary: Uint8ClampedArray, visited: Uint8Array, width: number, height: number, startX: number, startY: number) {
        const stack = [[startX, startY]];
        let size = 0;
        let sumX = 0;
        let sumY = 0;

        // Iterative flood fill to avoid stack overflow
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

            // Push neighbors
            if (x + 1 < width) stack.push([x + 1, y]);
            if (x - 1 >= 0) stack.push([x - 1, y]);
            if (y + 1 < height) stack.push([x, y + 1]);
            if (y - 1 >= 0) stack.push([x, y - 1]);
        }

        return {
            size,
            center: { x: sumX / size, y: sumY / size }
        };
    }
}
