const ytdl = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');
const os = require('os');

module.exports = async (req, res) => {
    // 1. Method verification
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');
    
    // 2. Setup path in temp directory
    const tmpDir = os.tmpdir();
    const fileName = `audio_${Date.now()}.mp3`;
    const outputPath = path.join(tmpDir, fileName);

    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "No URL provided" });

        // Use the library instead of shell execSync
        await ytdl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputPath
        });

        // 3. Read and return the file
        if (fs.existsSync(outputPath)) {
            const fileBuffer = fs.readFileSync(outputPath);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.send(fileBuffer);
            
            // Cleanup
            fs.unlinkSync(outputPath);
        } else {
            throw new Error("Conversion failed to produce output file");
        }
        
    } catch (err) {
        console.error("Conversion Error:", err);
        res.status(500).json({ 
            error: "Conversion failed. The video might be too long, private, or restricted.", 
            details: err.message 
        });
    }
};
