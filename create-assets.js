const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'assets', 'images');

// Create directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

console.log('✅ Created assets/images folder');
console.log('📝 Please add your app icons manually to assets/images/');
console.log('   Required files:');
console.log('   - icon.png (1024x1024)');
console.log('   - splash-icon.png (200x200 or larger)');
console.log('   - favicon.png (48x48)');
console.log('   - android-icon-foreground.png (1024x1024)');
console.log('   - android-icon-background.png (1024x1024)');
console.log('   - android-icon-monochrome.png (1024x1024)');