const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectId = 'c24515ff-e195-4492-b9b6-961e7ca30703';
const workDir = path.join(process.cwd(), 'tmp', 'uploads', projectId);
const segDir = path.join(workDir, 'segments');

function getFfmpegBin() {
    try {
        const ffmpegStatic = require('ffmpeg-static');
        let bin = ffmpegStatic;
        if (bin && bin.includes('\\ROOT\\')) {
            bin = path.join(process.cwd(), bin.replace(/^\\ROOT\\/, ''));
        }
        return bin || 'ffmpeg';
    } catch (e) {
        return 'ffmpeg';
    }
}

const ffmpegBin = getFfmpegBin();

function checkVolume(file) {
    console.log(`--- Checking ${path.basename(file)} ---`);
    if (!fs.existsSync(file)) {
        console.log("File not found!");
        return;
    }
    try {
        const out = execSync(`"${ffmpegBin}" -i "${file}" -af volumedetect -f null -`, { stdio: 'pipe' }).toString();
        // execSync doesn't usually return stderr if it doesn't fail, but FFmpeg outputs to stderr.
    } catch (e) {
        console.log(e.stderr.toString());
    }
}

checkVolume(path.join(workDir, 'audio.mp3'));
checkVolume(path.join(segDir, 'seg_0.mp3'));
checkVolume(path.join(workDir, 'dubbed_audio.mp3'));
