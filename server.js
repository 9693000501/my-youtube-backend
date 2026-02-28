const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
// Internet se kisi bhi website ko connect hone ki permission dena
app.use(cors({ origin: '*' })); 
app.use(express.json());

app.get('/api/download', (req, res) => {
    const videoUrl = req.query.url;
    const quality = req.query.quality || '9999';

    if (!videoUrl) {
        return res.status(400).send('URL is required');
    }

    // Cloud me temporary file ka naam
    const tempFileName = `video_${Date.now()}.mp4`;
    const tempFilePath = path.join(__dirname, tempFileName);

    // Command (Internet wale server par yt-dlp aur ffmpeg pehle se install honge Docker ki wajah se)
    const ytDlpArgs = [
        '-f', `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`,
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '-o', tempFilePath,
        videoUrl
    ];

    console.log(`Cloud Downloading video: ${videoUrl}`);
    const ytDlpProcess = spawn('yt-dlp', ytDlpArgs);

    ytDlpProcess.stdout.on('data', (data) => console.log(`yt-dlp: ${data}`));
    ytDlpProcess.stderr.on('data', (data) => console.log(`yt-dlp Info: ${data}`));

    ytDlpProcess.on('close', (code) => {
        if (code === 0) {
            console.log("Merge successful. Sending file to user...");
            res.download(tempFilePath, 'video.mp4', (err) => {
                // File bhejne ke baad server se delete kar do taaki memory full na ho
                fs.unlink(tempFilePath, () => console.log("Temp file deleted."));
            });
        } else {
            if (!res.headersSent) res.status(500).send('Cloud Download Failed');
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Cloud Server is perfectly running on port ${PORT}!`);
});
