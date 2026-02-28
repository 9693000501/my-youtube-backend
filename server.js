const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
// Internet se kisi bhi frontend ko connect hone dena
app.use(cors({ origin: '*' })); 
app.use(express.json());

// Main link check karne ke liye
app.get('/', (req, res) => {
    res.send('🚀 Nexus Ultra Fetch Backend is LIVE! (V5 - Fixed Merge issues)');
});

app.get('/api/download', (req, res) => {
    const videoUrl = req.query.url;
    // Render free tier ke liye 720p sabse stable hai, 1080p try kar sakte hain
    const quality = req.query.quality || '720'; 

    if (!videoUrl) {
        return res.status(400).send('URL is required');
    }

    // Cloud servers par hamesha /tmp folder use karna chahiye temporary files ke liye
    const tempFileName = `nexus_${Date.now()}.mp4`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    console.log(`Cloud Downloading: ${videoUrl} at ${quality}p`);

    // FINAL ROBUST ARGS
    const ytDlpArgs = [
        '-f', `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`,
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '--geo-bypass',
        '--force-ipv4',
        '--extractor-args', 'youtube:player_client=android,web;player_skip=webpage,configs',
        '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        '-o', tempFilePath,
        videoUrl
    ];

    const ytDlpProcess = spawn('yt-dlp', ytDlpArgs);

    // Logs monitoring (Render dashboard ke "Logs" tab mein dikhega)
    ytDlpProcess.stderr.on('data', (data) => {
        const log = data.toString();
        if (log.includes('ERROR')) {
            console.error(`yt-dlp Error: ${log}`);
        }
    });

    ytDlpProcess.on('close', (code) => {
        if (code === 0 && fs.existsSync(tempFilePath)) {
            const stats = fs.statSync(tempFilePath);
            console.log(`Success! File size: ${Math.round(stats.size / 1024 / 1024)} MB`);

            if (stats.size === 0) {
                fs.unlink(tempFilePath, () => {});
                return res.status(500).send('YouTube blocked data. Try a smaller quality.');
            }

            // File ko user ko bhejna
            res.download(tempFilePath, 'video.mp4', (err) => {
                // Bhejne ke baad delete karna zaroori hai
                fs.unlink(tempFilePath, (err) => {
                    if (err) console.error("Cleanup error:", err);
                    else console.log("Temp file cleared.");
                });
            });
        } else {
            console.error(`Process failed with code: ${code}`);
            if (!res.headersSent) {
                res.status(500).send('Download Failed. YouTube might be blocking the server IP. Try again in 2 minutes.');
            }
        }
    });

    // Timeout safety: Agar 5 minute tak kuch na ho toh band kar do
    setTimeout(() => {
        if (!res.headersSent) {
            ytDlpProcess.kill();
            res.status(504).send('Server Timeout: Video too large for Free Tier.');
        }
    }, 300000); // 5 minutes
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend Active on port ${PORT}`);
});
