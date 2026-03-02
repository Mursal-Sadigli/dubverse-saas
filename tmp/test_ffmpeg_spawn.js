const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegStatic = require('ffmpeg-static');

const projectId = "d3665de0-b8b5-4395-af2a-3d5b4276c805";
const workDir = path.join(process.cwd(), "tmp", "uploads", projectId);
const segDir = path.join(workDir, "segments");
const dubbedAudioPath = path.join(workDir, "dubbed_audio_spawn.mp3");

let ffmpegBin = ffmpegStatic;
if (ffmpegBin && ffmpegBin.includes("\\ROOT\\")) {
    ffmpegBin = path.join(process.cwd(), ffmpegBin.replace(/^\\ROOT\\/, ""));
}

const segmentPaths = [];
for (let i = 0; i < 7; i++) {
    segmentPaths.push({
        audioPath: path.join(segDir, `seg_${i}.mp3`),
        start: i * 5,
        end: (i + 1) * 5
    });
}

const originalAudioPath = path.join(workDir, "audio.mp3");
const duration = 35;
let filterParts = [];
let args = ["-nostdin", "-hide_banner", "-i", originalAudioPath];

segmentPaths.forEach((seg, i) => {
    args.push("-i", seg.audioPath);
    const delay = Math.round(seg.start * 1000);
    filterParts.push(`[${i + 1}:a]adelay=${delay}|${delay}[s${i}]`);
});

const mixInputs = segmentPaths.map((_, i) => `[s${i}]`).join("");
filterParts.push(`[0:a]volume=0.2[bg];[bg]${mixInputs}amix=inputs=${segmentPaths.length + 1}:normalize=0[out]`);

args.push("-filter_complex", filterParts.join(";"), "-map", "[out]", "-t", Math.ceil(duration).toString(), "-y", dubbedAudioPath);

console.log("Starting FFmpeg with spawn...");
console.log("Binary:", ffmpegBin);
console.log("Args:", JSON.stringify(args));

const child = spawn(ffmpegBin, args);

child.stdout.on('data', (data) => console.log(`stdout: ${data}`));
child.stderr.on('data', (data) => console.log(`stderr: ${data}`));

child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
