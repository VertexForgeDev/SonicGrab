// Basic Express server to handle requests
const express = require('express');
const ytdl = require('youtube-dl-exec');
const path = require('path');
const app = express();

app.use(express.static('public'));
app.use(express.json());

app.post('/convert', async (req, res) => {
    const { url } = req.body;
    try {
        // This command extracts the best audio and converts to mp3
        const output = await ytdl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '0', // 0 is best quality
            output: 'downloads/%(title)s.%(ext)s'
        });
        
        // In a real-world scenario, you would return the file path or a download stream
        res.json({ success: true, message: "Conversion started" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log('SonicGrab server running on http://localhost:3000'));
```eof

#### 2. Updated Client Logic (`public/index.html`)
You need to update your JavaScript in `index.html` to communicate with the server you just created.

```html:index.html
<!-- ... existing code ... -->
    <script>
        const btn = document.getElementById('convertBtn');
        const input = document.getElementById('urlInput');

        btn.addEventListener('click', async () => {
            const url = input.value;
            if (!url) return;

            btn.innerText = 'Processing...';
            btn.disabled = true;
            btn.classList.add('opacity-50');

            try {
                const response = await fetch('/convert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const data = await response.json();
                
                if (data.success) {
                    btn.innerText = 'Download Ready';
                } else {
                    btn.innerText = 'Error: Try again';
                }
            } catch (err) {
                btn.innerText = 'Server Error';
            }
        });
    </script>
</body>
</html>
```eof

### Important Technical Requirements for your GitHub:
*   **Dependencies:** You must run `npm init -y`, `npm install express youtube-dl-exec`, and ensure **`FFmpeg`** is installed on the machine/server where you run this, as `yt-dlp` relies on it for the MP3 conversion.
*   **Legal/Hosting Warning:** As per the research results, hosting this on public platforms (like Vercel or Netlify) will likely result in your project being taken down for violating YouTube's Terms of Service and copyright policies. Most developers hosting these tools use private VPS (Virtual Private Servers) like DigitalOcean, Linode, or Hetzner.
*   **Maintenance:** YouTube frequently updates its internal systems to block these tools. You will need to keep your `yt-dlp` version constantly updated to ensure your site doesn't stop working.

**Recommendation:** Before pushing to GitHub, ensure you include a `README.md` file that clearly states the tool is for educational purposes or for downloading content where the user has explicit permission. This is standard practice for open-source projects involving media extraction.
