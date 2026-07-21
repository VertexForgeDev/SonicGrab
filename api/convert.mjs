export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "No URL provided" });

    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    const videoId = match ? match[1] : null;

    if (!videoId) return res.status(400).json({ success: false, error: "Invalid YouTube URL" });

    const apiKey = process.env.RAPIDAPI;
    if (!apiKey) {
        return res.status(500).json({ success: false, error: "Missing API configuration" });
    }

    const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const response = await fetch(`https://youtube-mp3-2025.p.rapidapi.com/v1/social/youtube/audio`, {
            method: 'POST',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'youtube-mp3-2025.p.rapidapi.com',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                url: targetUrl,
                quality: '320kbps' // Set to 320kbps for maximum audio quality
            })
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return res.status(500).json({ success: false, error: "Invalid JSON response from provider" });
        }

        if (data.message || data.error === "true" || data.error === true) {
            return res.status(500).json({ 
                success: false, 
                error: data.message || "Provider failed to extract link." 
            });
        }

        const downloadUrl = data.linkDownload || data.linkDownloadProgress || data.link;

        if (!downloadUrl) {
            return res.status(500).json({ success: false, error: "Could not retrieve download link" });
        }

        return res.status(200).json({ 
            success: true, 
            title: data.title || "Audio Download", 
            link: downloadUrl 
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Server error: " + error.message });
    }
}
