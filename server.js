/* STREAMING_CHUNK:Initializing dependencies and app configuration */
const express = require('express');
const ytdl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.static('public'));
app.use(express.json());

/* STREAMING_CHUNK:Configuring download directory */
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
}

/* STREAMING_CHUNK:Defining conversion route */
app.post('/convert', async (req, res) => {
    const { url } = req.body;
    
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
        return res.status(400).json({ success: false, error: "Invalid URL." });
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

        if (!targetFile) throw new Error("File not found.");

        const rawTitle = targetFile.substring(id.length + 1).replace('.mp3', '');

        res.json({ 
            success: true, 
            downloadUrl: `/download/${id}`, 
            title: rawTitle 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/* STREAMING_CHUNK:Defining download route and cleanup logic */
app.get('/download/:id', (req, res) => {
    const { id } = req.params;
    const files = fs.readdirSync(downloadDir);
    const targetFile = files.find(f => f.startsWith(`${id}_`));

    if (!targetFile) return res.status(404).send('File expired or not found.');

    const filePath = path.join(downloadDir, targetFile);
    res.download(filePath, targetFile.substring(id.length + 1), (err) => {
        if (!err) fs.unlinkSync(filePath);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
```eof

```json:package.json
{
  "name": "sonic-grab",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "youtube-dl-exec": "^2.4.15"
  }
}
```eof

```html:public/index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- STREAMING_CHUNK:Styling page layout -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SonicGrab</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-lg bg-slate-900 p-8 rounded-3xl border border-slate-800">
        <h1 class="text-2xl font-bold mb-6">SonicGrab</h1>
        <input type="text" id="urlInput" placeholder="Paste YouTube URL..." class="w-full p-4 mb-4 rounded-xl bg-slate-800 border border-slate-700">
        <button id="convertBtn" class="w-full py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition">Convert</button>
        <div id="status" class="mt-4 text-center hidden"></div>
    </div>

    <!-- STREAMING_CHUNK:Defining event listeners -->
    <script>
        const btn = document.getElementById('convertBtn');
        const input = document.getElementById('urlInput');
        const status = document.getElementById('status');

        btn.addEventListener('click', async () => {
            const url = input.value;
            if (!url) return;

            btn.disabled = true;
            status.classList.remove('hidden');
            status.innerText = "Processing...";

            const res = await fetch('/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await res.json();
            if (data.success) {
                status.innerHTML = `<a href="${data.downloadUrl}" class="text-emerald-400 font-bold">Download ${data.title}</a>`;
            } else {
                status.innerText = "Error: " + data.error;
            }
            btn.disabled = false;
        });
    </script>
</body>
</html>
```eof
