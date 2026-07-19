export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "No URL provided" });

    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    const videoId = match ? match[1] : null;

    if (!videoId) return res.status(400).json({ success: false, error: "Invalid YouTube URL" });
    if (!process.env.RAPIDAPI_KEY) return res.status(500).json({ success: false, error: "Missing API configuration" });

    try {
        // 1. Get the download URL from the API
        const response = await fetch(`https://youtube-to-mp315.p.rapidapi.com/download`, {
            method: 'POST',
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'youtube-to-mp315.p.rapidapi.com',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${videoId}`,
                format: 'mp3',
                quality: 0 
            })
        });

        const data = await response.json();
        const downloadUrl = data.downloadUrl || data.link;

        if (!downloadUrl) {
            return res.status(500).json({ success: false, error: "Could not retrieve download link" });
        }

        // 2. Fetch the actual file content
        const fileResponse = await fetch(downloadUrl);
        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Set headers to force download
        const filename = encodeURIComponent((data.title || "audio").replace(/[^a-z0-9]/gi, '_'));
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.mp3"`);
        
        // 4. Send the file content
        return res.send(buffer);

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
