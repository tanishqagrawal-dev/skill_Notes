const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'assets');

async function compressLogo() {
    const logoPath = path.join(assetsDir, 'logo.jpg');
    const tempLogoPath = path.join(assetsDir, 'logo_temp.jpg');
    
    console.log(`Analyzing logo: ${logoPath}`);
    const metadata = await sharp(logoPath).metadata();
    console.log(`Original logo dimensions: ${metadata.width}x${metadata.height}`);
    
    // Resize to 400px max width for retina footer usage
    await sharp(logoPath)
        .resize({ width: 400, withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toFile(tempLogoPath);
        
    const originalSize = fs.statSync(logoPath).size;
    const compressedSize = fs.statSync(tempLogoPath).size;
    console.log(`Logo: ${originalSize} bytes -> ${compressedSize} bytes (Saved ${((originalSize - compressedSize) / originalSize * 100).toFixed(1)}%)`);
    
    // Replace original
    fs.unlinkSync(logoPath);
    fs.renameSync(tempLogoPath, logoPath);
}

async function compressHero() {
    const heroPath = path.join(assetsDir, 'students_hero.png');
    const tempHeroPath = path.join(assetsDir, 'students_hero_temp.png');
    
    console.log(`Analyzing hero image: ${heroPath}`);
    const metadata = await sharp(heroPath).metadata();
    console.log(`Original hero dimensions: ${metadata.width}x${metadata.height}`);
    
    // Resize to 1200px max width for hero usage and optimize PNG size using palette/quantization
    await sharp(heroPath)
        .resize({ width: 1200, withoutEnlargement: true })
        .png({ palette: true, quality: 80, compressionLevel: 9 })
        .toFile(tempHeroPath);
        
    const originalSize = fs.statSync(heroPath).size;
    const compressedSize = fs.statSync(tempHeroPath).size;
    console.log(`Hero: ${originalSize} bytes -> ${compressedSize} bytes (Saved ${((originalSize - compressedSize) / originalSize * 100).toFixed(1)}%)`);
    
    // Replace original
    fs.unlinkSync(heroPath);
    fs.renameSync(tempHeroPath, heroPath);
}

async function run() {
    try {
        await compressLogo();
        await compressHero();
        console.log('Image compression completed successfully!');
    } catch (err) {
        console.error('Error during image compression:', err);
    }
}

run();
