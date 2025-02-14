const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, '../src/icons/trombone.png'); // votre icône source
const outputDir = path.join(__dirname, '../src/icons');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
    for (const size of sizes) {
        try {
            await sharp(sourceIcon)
                .resize(size, size)
                .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
            console.log(`✓ Generated ${size}x${size} icon`);
        } catch (err) {
            console.error(`✗ Error generating ${size}x${size} icon:`, err);
        }
    }
}

generateIcons();