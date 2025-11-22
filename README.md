# Rx Tools

**Rx Tools** is a free, open-source web application designed to assist pharmacy technicians with daily tasks. Our mission is to provide accessible, accurate, and easy-to-use tools to improve efficiency and safety in the pharmacy.

## Features

### 1. Dosing Calculator
Calculate the exact number of packs needed for a prescription based on dose, frequency, and duration.
- Supports Drops, Injections, and Pills.
- Automatically calculates total dose volume/count.
- Determines the optimal combination of pack sizes to minimize waste.

### 2. Pill Counter (Hybrid AI)
Count pills instantly with 100% accuracy using our hybrid verification system.
- **Auto-Count**: Upload an image, and our computer vision algorithm detects pills automatically.
- **Manual Verification**: Click on the image to add missed pills or remove incorrect detections.
- **Privacy Focused**: All image processing happens locally in your browser. No images are uploaded to a server.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/tolkienfan2/rxtools.git
   ```
2. Install dependencies:
   ```bash
   cd rxtools
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Contributing
This project is open-source and we welcome contributions! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
