import express, { json } from 'express';
import multer from 'multer';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';

// Importing your modular logic
import { cleanImage } from './processors/imageCleaner';
import { processReceipt } from './services/ocrService';
import { parseReceiptData } from './utils/dataParser';

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for temporary storage
const upload = multer({ dest: 'data/input/' });

app.use(json());

/**
 * POST /process
 * Receives a receipt image, processes it, and returns JSON.
 */
app.post('/process', upload.single('receipt'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }

    const inputPath = req.file.path;
    const processedPath = join('data/processed', `clean_${req.file.filename}.png`);

    try {
        // 1. Image Pre-processing (Sharp)
        await cleanImage(inputPath, processedPath);

        // 2. OCR Execution (Tesseract)
        const rawText = await processReceipt(processedPath);

        // 3. Data Extraction (Regex)
        const structuredData = parseReceiptData(rawText);

        // 4. Cleanup: Remove the temporary files to save space
        unlinkSync(inputPath);
        unlinkSync(processedPath);

        // Send the clean data back to the web-app
        res.json({
            success: true,
            data: structuredData,
            raw: rawText // Optional: helpful for debugging accuracy
        });

    } catch (error) {
        console.error('Processing Pipeline Failed:', error);
        res.status(500).json({ success: false, error: 'Failed to process receipt.' });
    }
});

app.listen(PORT, () => {
    console.log(`OCR Engine running at http://localhost:${PORT}`);
});