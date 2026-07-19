const ytdl = require('yt-dlp-exec');
const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

module.exports = async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');
    
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    const tmpDir = os.tmpdir();
    const outputPath = path.join(tmpDir, `audio_${Date.now()}.mp3`);

    try {
        await ytdl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            ffmpegLocation: ffmpegPath,
            output: outputPath
        });

        const fileBuffer = fs.readFileSync(outputPath);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
        res.send(fileBuffer);
        
        // Clean up
        fs.unlink(outputPath, () => {});
    } catch (err) {
        res.status(500).json({ error: "Conversion failed", details: err.message });
    }
};
