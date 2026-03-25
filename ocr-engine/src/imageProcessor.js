import sharp from 'sharp';

async function cleanImage(inputPath, outputPath) {
  await sharp(inputPath)
    .greyscale()      // Remove color noise
    .linear(1.5, 0)   // Boost contrast
    .resize(2000)     // Upscale if the image is small
    .toFile(outputPath);
}