const { createWorker } = require('tesseract.js');

async function processReceipt(imagePath) {
    console.log(`[OCR] Starting OCR on: ${imagePath}`);
    try {
        console.log('[OCR] Creating worker...');
        const worker = await createWorker('eng');
        console.log('[OCR] Worker created. Setting parameters...');
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$+-:() ',
        });
        console.log('[OCR] Parameters set. Recognizing image...');
        const result = await worker.recognize(imagePath);
        console.log('[OCR] Recognition complete. Raw result:', result);
        const text = result && result.data && result.data.text;
        console.log("=== OCR RESULT ===");
        if (text && text.trim()) {
            console.log(text);
        } else {
            console.log('(No text recognized)');
        }
        await worker.terminate();
        console.log('[OCR] Worker terminated.');
        return text;
    } catch (error) {
        console.error("[OCR] Error processing receipt:", error);
        return null;
    }
}

module.exports = { processReceipt };

if (require.main === module) {
    const path = process.argv[2];
    if (!path || !/\.(png|jpg|jpeg)$/i.test(path)) {
        console.error('Usage: node src/ocrProcessor.cjs <image.(png|jpg|jpeg)>');
        process.exit(1);
    }
    console.log('Processing file:', path);
    processReceipt(path)
        .then(result => {
            console.log('\n--- OCR OUTPUT ---\n');
            if (result) {
                console.log(result);
            } else {
                console.log('(No text recognized or error occurred)');
            }
        })
        .catch(err => {
            console.error('OCR failed:', err);
            process.exit(2);
        });
}