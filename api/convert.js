const ytdl = require('yt-dlp-exec');
const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');
    
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    // Use /tmp for all write operations
    const tmpDir = os.tmpdir();
    const id = Date.now();
    const outputPath = path.join(tmpDir, `${id}.mp3`);

    try {
        console.log("Starting conversion for:", url);
        
        await ytdl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            ffmpegLocation: ffmpegPath,
            output: outputPath
        });

        if (!fs.existsSync(outputPath)) {
            throw new Error("FFmpeg failed to produce an output file.");
        }

        const fileBuffer = fs.readFileSync(outputPath);
        
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
        res.send(fileBuffer);
        
        // Cleanup
        fs.unlink(outputPath, () => {});
        
    } catch (err) {
        console.error("CRITICAL CONVERSION ERROR:", err);
        res.status(500).json({ 
            error: "Conversion failed.", 
            details: err.message,
            stack: err.stack 
        });
    }
};
