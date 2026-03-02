const ffmpeg = require('ffmpeg-static');
const path = require('path');
console.log('Original:', ffmpeg);
console.log('Resolved:', path.resolve(ffmpeg));
console.log('Exists:', require('fs').existsSync(ffmpeg));
