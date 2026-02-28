const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
// Internet se kisi bhi frontend ko connect hone dena
app.use(cors({ origin: '*' })); 
app.use(express.json());

// Main link check karne ke liye
app.get('/', (req, res) => {
    res.send('🚀 Nexus Ultra Fetch Backend is LIVE and bypassing blocks!');
});

app.get('/api/download', (req, res) => {
    const videoUrl = req.query.url;
    // Render free tier par 720p sabse stable chalta hai
    const quality = req.query.quality || '720'; 

    if (!videoUrl) {
        return res.status(400).send('URL is required');
    }

    console.log(`Cloud Fetching (Super Bypass Mode): ${videoUrl}`);

    // Browser ko batana ki file download karni hai
    res.header('Content-Disposition', 'attachment; filename="video.mp4"');
    res.header('Content-Type', 'video/mp4');

    // NAYA SUPER BYPASS ARGS (YouTube Block todne ke liye)
    const ytDlpArgs = [
        '-f', `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`,
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '--geo-bypass',
        '--force-ipv4',
        // 'ios' client spoofing sabse powerful bypass hai
        '--extractor-args', 'youtube:player_client=ios,web;player_skip=webpage,configs',
        '--add-header', 'User-Agent:Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
        '-o', '-', // Isse video server par save nahi hogi, seedha user ko stream hogi
        videoUrl
    ];

    const ytDlpProcess = spawn('yt-dlp', ytDlpArgs);

    // Video stream ko seedha user ke browser mein pipe (bhejna) karna
    ytDlpProcess.stdout.pipe(res);

    ytDlpProcess.stderr.on('data', (data) => {
        const log = data.toString();
        console.log(`yt-dlp log: ${log}`);
    });

    ytDlpProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Process exited with code ${code}`);
            if (!res.headersSent) res.status(500).send('YouTube Blocked this request. Try again.');
        } else {
            console.log("Stream completed successfully!");
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend Active on port ${PORT}`);
});
