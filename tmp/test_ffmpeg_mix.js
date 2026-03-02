const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execPromise = promisify(exec);

const projectId = "d3665de0-b8b5-4395-af2a-3d5b4276c805";
const workDir = path.join(process.cwd(), "tmp", "uploads", projectId);
const segDir = path.join(workDir, "segments");
const dubbedAudioPath = path.join(workDir, "dubbed_audio_test.mp3");

// Mocking segments from what I saw on disk
const segmentPaths = [];
for (let i = 0; i < 7; i++) {
    segmentPaths.push({
        audioPath: path.join(segDir, `seg_${i}.mp3`),
        start: i * 5, // mock starts
        end: (i + 1) * 5
    });
}

const duration = 35;
let filterParts = [];
let inputs = [`-f lavfi -i anullsrc=r=44100:cl=stereo -t ${Math.ceil(duration)}`];

segmentPaths.forEach((seg, i) => {
    // Escape backslashes for filter_complex if needed
    inputs.push(`-i "${seg.audioPath}"`);
    const delay = Math.round(seg.start * 1000);
    filterParts.push(`[${i + 1}:a]adelay=${delay}|${delay}[s${i}]`);
});

const mixInputs = segmentPaths.map((_, i) => `[s${i}]`).join("");
filterParts.push(`[0:a]${mixInputs}amix=inputs=${segmentPaths.length + 1}:normalize=0[out]`);

const ffmpegBin = "ffmpeg"; 

async function test() {
    console.log("Starting FFmpeg test...");
    const cmd = `"${ffmpegBin}" -nostdin -hide_banner ${inputs.join(" ")} -filter_complex "${filterParts.join(";")}" -map "[out]" -t ${Math.ceil(duration)} -y "${dubbedAudioPath}"`;
    console.log("Command:", cmd);
    
    try {
        const { stdout, stderr } = await execPromise(cmd);
        console.log("Success!");
    } catch (err) {
        console.error("Failed!");
        console.error("Error:", err.message);
        console.error("Stderr:", err.stderr);
    }
}

test();
