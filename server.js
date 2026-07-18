/* STREAMING_CHUNK:Configuring server engine */
const express = require('express');
const ytdl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
}

/* STREAMING_CHUNK:Explicitly defining POST route */
app.post('/convert', async (req, res) => {
    console.log("[DEBUG] Received POST request to /convert");
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: "No URL provided" });
    }

    const id = Date.now().toString();

    try {
        await ytdl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '0',
            output: path.join(downloadDir, `${id}_%(title)s.%(ext)s`),
            noPlaylist: true,
        });

        const files = fs.readdirSync(downloadDir);
        const targetFile = files.find(f => f.startsWith(`${id}_`));

        if (!targetFile) throw new Error("File not found after conversion.");

        const rawTitle = targetFile.substring(id.length + 1).replace('.mp3', '');

        res.json({ 
            success: true, 
            downloadUrl: `/download/${id}`, 
            title: rawTitle 
        });
    } catch (error) {
        console.error("[ERROR] Conversion failed:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/* STREAMING_CHUNK:Defining download route */
app.get('/download/:id', (req, res) => {
    const { id } = req.params;
    const files = fs.readdirSync(downloadDir);
    const targetFile = files.find(f => f.startsWith(`${id}_`));

    if (!targetFile) return res.status(404).send('File not found.');

    const filePath = path.join(downloadDir, targetFile);
    res.download(filePath, targetFile.substring(id.length + 1), (err) => {
        if (!err) fs.unlink(filePath, () => {});
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SonicGrab active on port ${PORT}`));
```eof

### Why this fixes the `405` error:
1.  **Middleware order:** `app.use(express.json())` is now strictly defined before the route, ensuring the server can read your JSON request.
2.  **Request Logging:** When you run this, look at your terminal. If you see `[DEBUG] Received POST request to /convert`, the connection is working. If you *don't* see that, your `index.html` is sending the request to the wrong place.

**Test it now:**
1. Stop your server (`Ctrl + C`).
2. Run `node server.js`.
3. Check the terminal for the `SonicGrab active on port 3000` message.
4. Try again and watch the terminal to see if the `[DEBUG]` message appears.
