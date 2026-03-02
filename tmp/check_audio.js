const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectId = 'c24515ff-e195-4492-b9b6-961e7ca30703';
const workDir = path.join(process.cwd(), 'tmp', 'uploads', projectId);
const segDir = path.join(workDir, 'segments');

if (!fs.existsSync(segDir)) {
    console.error("Segment directory not found:", segDir);
    process.exit(1);
}

const segments = fs.readdirSync(segDir).filter(f => f.endsWith('.mp3'));

segments.forEach(seg => {
    const filePath = path.join(segDir, seg);
    const stats = fs.statSync(filePath);
    console.log(`Checking ${seg}: ${stats.size} bytes`);

    // Use FFmpeg to check volume levels
    try {
        const output = execSync(`ffmpeg -i "${filePath}" -af volumedetect -f null -`, { stdio: 'pipe' }).toString();
        const maxVol = output.match(/max_volume: ([\-\d\.]+) dB/);
        const meanVol = output.match(/mean_volume: ([\-\d\.]+) dB/);
        console.log(`  Volume: Max ${maxVol ? maxVol[1] : 'N/A'} dB, Mean ${meanVol ? meanVol[1] : 'N/A'} dB`);
    } catch (e) {
        // execSync throws on FFmpeg output to stderr, which is normal for volumedetect
        const output = e.stderr.toString();
        const maxVol = output.match(/max_volume: ([\-\d\.]+) dB/);
        const meanVol = output.match(/mean_volume: ([\-\d\.]+) dB/);
        console.log(`  Volume: Max ${maxVol ? maxVol[1] : 'N/A'} dB, Mean ${meanVol ? meanVol[1] : 'N/A'} dB`);
    }
});

const dubbedFile = path.join(workDir, 'dubbed_audio.mp3');
if (fs.existsSync(dubbedFile)) {
    console.log(`Checking final dubbed_audio.mp3: ${fs.statSync(dubbedFile).size} bytes`);
    try {
        const output = execSync(`ffmpeg -i "${dubbedFile}" -af volumedetect -f null -`, { stdio: 'pipe' }).toString();
    } catch (e) {
        const output = e.stderr.toString();
        const maxVol = output.match(/max_volume: ([\-\d\.]+) dB/);
        const meanVol = output.match(/mean_volume: ([\-\d\.]+) dB/);
        console.log(`  Final Volume: Max ${maxVol ? maxVol[1] : 'N/A'} dB, Mean ${meanVol ? meanVol[1] : 'N/A'} dB`);
    }
}
