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
        // Example using a provider that accepts format and quality payloads
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
                quality: 320 // Forces the backend engine to compile at 320kbps
            })
        });

        const data = await response.json();
        
        // Note: Change 'data.downloadUrl' to match the exact JSON key your new provider returns
        return res.status(200).json({ 
            success: true, 
            title: data.title || "Audio Track", 
            link: data.downloadUrl || data.link 
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
