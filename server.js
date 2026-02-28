const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
// Internet se kisi bhi frontend ko connect hone dena
app.use(cors({ origin: '*' })); 
app.use(express.json());

// Main link check karne ke liye
app.get('/', (req, res) => {
    res.send('🚀 Nexus Ultra Fetch Backend is LIVE! (Fixed 0-byte issue)');
});

app.get('/api/download', (req, res) => {
    const videoUrl = req.query.url;
    // Render free tier par 720p ya 1080p select karein
    const quality = req.query.quality || '1080'; 

    if (!videoUrl) {
        return res.status(400).send('URL is required');
    }

    // Temporary file path (Server ki memory/disk mein save hoga)
    const tempFileName = `nexus_video_${Date.now()}.mp4`;
    const tempFilePath = path.join(__dirname, tempFileName);

    console.log(`Cloud Downloading with Merge: ${videoUrl}`);

    // FINAL BYPASS ARGS (Fixed for YouTube and Pinterest)
    // Hum -o - hata rahe hain aur tempFilePath use kar rahe hain merge ke liye
    const ytDlpArgs = [
        '-f', `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`,
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '--geo-bypass',
        '--force-ipv4',
        '--extractor-args', 'youtube:player_client=ios,web;player_skip=webpage,configs',
        '--add-header', 'User-Agent:Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
        '-o', tempFilePath, // File pehle server par merge hogi
        videoUrl
    ];

    const ytDlpProcess = spawn('yt-dlp', ytDlpArgs);

    ytDlpProcess.stderr.on('data', (data) => {
        console.log(`Log: ${data.toString()}`);
    });

    ytDlpProcess.on('close', (code) => {
        if (code === 0 && fs.existsSync(tempFilePath)) {
            const stats = fs.statSync(tempFilePath);
            console.log(`Download complete! Size: ${stats.size} bytes`);

            // Agar size 0 hai toh error bhej do
            if (stats.size === 0) {
                fs.unlink(tempFilePath, () => {});
                return res.status(500).send('YouTube blocked data transfer (0 bytes).');
            }

            // File ko browser mein bhejna
            res.download(tempFilePath, 'video.mp4', (err) => {
                // Bhejne ke baad server se file delete kar do
                fs.unlink(tempFilePath, (err) => {
                    if (err) console.error("Error deleting file:", err);
                    else console.log("Temp file cleaned up.");
                });
            });
        } else {
            console.error(`Process failed with code ${code}`);
            if (!res.headersSent) res.status(500).send('Download or Merge failed.');
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend Active on port ${PORT}`);
});
