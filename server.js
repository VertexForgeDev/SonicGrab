onst express = require('express');
const ytdl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.static('public'));
app.use(express.json());

// Ensure the local download directory exists securely
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
}

app.post('/convert', async (req, res) => {
    const { url } = req.body;
    
    // Validate request inputs
    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
        return res.status(400).json({ success: false, error: "Please provide a valid YouTube URL." });
    }

    // Generate a unique transaction ID for this download task
    const id = Date.now().toString();
    console.log(`[PROCESS] Initiating extraction id ${id} for URL: ${url}`);

    try {
        // We output using the format: id_%(title)s.%(ext)s to dynamically catch the title
        await ytdl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '0', // Highest quality possible
            output: path.join(downloadDir, `${id}_%(title)s.%(ext)s`),
            noPlaylist: true,
        });

        const files = fs.readdirSync(downloadDir);
        const targetFile = files.find(f => f.startsWith(`${id}_`));

        if (!targetFile) {
            throw new Error("Conversion finished but output file was not found.");
        }

        // Clean file names to look standard
        const rawTitle = targetFile.substring(id.length + 1).replace('.mp3', '');
        console.log(`[SUCCESS] Extracted sound file: "${rawTitle}"`);

        res.json({ 
            success: true, 
            downloadUrl: `/download/${id}`, 
            title: rawTitle 
        });

    } catch (error) {
        console.error(`[FAILURE] Extraction failed on item ${id}:`, error.message);
        res.status(500).json({ 
            success: false, 
            error: "Audio extraction failed. Verify that FFmpeg is installed and the video is public." 
        });
    }
});

app.get('/download/:id', (req, res) => {
    const { id } = req.params;
    
    try {
        const files = fs.readdirSync(downloadDir);
        const targetFile = files.find(f => f.startsWith(`${id}_`));

        if (!targetFile) {
            return res.status(404).send('Error: This download has expired or does not exist.');
        }

        const filePath = path.join(downloadDir, targetFile);
        const cleanDownloadName = `${targetFile.substring(id.length + 1)}`;

        // Stream the download to the client
        res.download(filePath, cleanDownloadName, (err) => {
            if (err) {
                console.error(`[ERROR] Transmission interrupted on ${id}:`, err);
            }
            
            // Delete the file after transmission to maintain empty server memory space
            try {
                fs.unlinkSync(filePath);
                console.log(`[CLEANUP] Automatically pruned disk file: ${targetFile}`);
            } catch (unlinkErr) {
                console.error(`[CLEANUP ERROR] Failed to clean file:`, unlinkErr);
            }
        });
    } catch (err) {
        res.status(500).send('Server Error handling file delivery.');
    }
});

// Cleans up any abandoned downloads older than 15 minutes every 10 minutes
setInterval(() => {
    fs.readdir(downloadDir, (err, files) => {
        if (err) return;
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(downloadDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                if (now - stats.mtimeMs > 900000) { // 15 Minutes
                    fs.unlink(filePath, () => {
                        console.log(`[CRON CLEANUP] Removed idle file: ${file}`);
                    });
                }
            });
        });
    });
}, 600000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`  SonicGrab System Operational on Port : ${PORT}`);
    console.log(`=================================================\n`);
});
