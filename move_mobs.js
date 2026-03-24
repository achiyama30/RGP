import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bgDir = path.join(__dirname, 'public', 'assets', 'bg');
const mobsDir = path.join(__dirname, 'public', 'assets', 'mobs');

if (!fs.existsSync(mobsDir)) {
    fs.mkdirSync(mobsDir, { recursive: true });
}

const mappings = [
    { old: 'Screenshot 2026-03-24 140841.png', new: 'frost_warrior.png' },
    { old: 'Screenshot 2026-03-24 141810.png', new: 'deep_troll.png' },
    { old: 'Screenshot 2026-03-24 144514.png', new: 'giant_spider.png' }
];

let success = 0;
for (const map of mappings) {
    const oldPath = path.join(bgDir, map.old);
    const newPath = path.join(mobsDir, map.new);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Renamed ${map.old} -> ${map.new}`);
        success++;
    } else {
        console.log(`⚠️ File not found: ${map.old}`);
    }
}

if (success === 3) {
    console.log("🎉 All 3 monster images successfully moved to public/assets/mobs!");
}
