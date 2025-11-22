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

        // Simple adaptive thresholding or fixed for now
        // Let's assume pills are lighter than background for this iteration
        // or we can try to detect contrast.
        // Using a fixed threshold for simplicity in this version.
        // In a real app, we'd use Otsu's method.

        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
            // Grayscale
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += avg;
        }
        const mean = sum / (width * height);
        const threshold = mean; // Simple mean threshold

        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const index = i / 4;
            // Invert if background is light? 
            // Let's assume high contrast.
            binary[index] = avg > threshold ? 1 : 0; // 1 for object, 0 for background (assuming light pills)
            // If we assume dark pills on light background, flip this.
            // For now, we'll stick to this and maybe add a toggle or auto-detect.
        }
        return binary;
    }

    private findBlobs(binary: Uint8ClampedArray, width: number, height: number): Point[] {
        const visited = new Uint8Array(width * height);
        const blobs: Point[] = [];
        const minBlobSize = 50; // Minimum pixels to consider a pill

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (binary[idx] === 1 && visited[idx] === 0) {
                    const { size, center } = this.floodFill(binary, visited, width, height, x, y);
                    if (size > minBlobSize) {
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

            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }

        return {
            size,
            center: { x: sumX / size, y: sumY / size }
        };
    }
}
