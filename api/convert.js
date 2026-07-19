const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');
    
    // 1. Ensure we only write to the temp directory
    const tmpDir = os.tmpdir();
    const outputPath = path.join(tmpDir, 'output.mp3');

    try {
        const { url } = req.body;
        
        // 2. Use full paths for binaries and force use of /tmp
        // We assume yt-dlp is in your root folder
        const command = `./yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`;
        
        execSync(command, { 
            env: { ...process.env, PATH: process.env.PATH + ':' + process.cwd() },
            stdio: 'inherit' 
        });

        const fileBuffer = fs.readFileSync(outputPath);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
        res.send(fileBuffer);
        
    } catch (err) {
        console.error("Conversion Error:", err);
        res.status(500).json({ error: "Failed to convert. The video might be too long or restricted.", details: err.message });
    }
}
