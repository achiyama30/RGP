import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 Starting deployment process...");

// 1. Copy Background Images
const bgDir = path.join(__dirname, 'public', 'assets', 'bg');
if (!fs.existsSync(bgDir)) {
    fs.mkdirSync(bgDir, { recursive: true });
}

const brainDir = "C:\\Users\\shlom\\.gemini\\antigravity\\brain\\d8f45b7d-4ad7-46f0-b409-4a874d70e3d6";
const images = {
    "main_menu_bg_1773837981179.png": "main.png",
    "battle_arena_bg_1773838087683.png": "battle.png",
    "map_bg_1773838250453.png": "map.png",
    "shop_bg_1773840446678.png": "shop.png",
    "camp_bg_1773840502118.png": "camp.png"
};

console.log("🎨 Copying background images from Ai brain...");
for (const [srcName, destName] of Object.entries(images)) {
    const srcPath = path.join(brainDir, srcName);
    const destPath = path.join(bgDir, destName);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied: ${destName}`);
    } else {
        console.error(`❌ Could not find: ${srcPath}. Creating an empty placeholder...`);
        // Create an empty fallback file to prevent 404 crashes just in case
        fs.writeFileSync(destPath, '');
    }
}

// 2. Git Synchronization
console.log("\n📦 Pushing updates to Git...");
try {
    execSync('git add .', { stdio: 'inherit' });
    
    // Check if there are changes to commit
    const status = execSync('git status --porcelain').toString();
    if (status.trim().length > 0) {
        execSync('git commit -m "Update UI overhaul, fix crashes, copy backgrounds"', { stdio: 'inherit' });
        execSync('git push', { stdio: 'inherit' });
        console.log("🎉 Successfully pushed to Git!");
    } else {
        console.log("✨ No new changes to commit. Everything is up to date!");
    }
} catch (error) {
    console.error("\n⚠️ Git operation encountered an issue (maybe no remote origin or already pushed):");
    console.error(error.message);
}

console.log("\n✨ All Done! Run 'npm run dev' to see your backgrounds in the game!");
