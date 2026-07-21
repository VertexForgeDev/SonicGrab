export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "No URL provided" });

    // Validate YouTube URL structure
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    const videoId = match ? match[1] : null;

    if (!videoId) return res.status(400).json({ success: false, error: "Invalid YouTube URL" });

    const apiKey = process.env.RAPIDAPI;
    if (!apiKey) {
        return res.status(500).json({ success: false, error: "Missing RAPIDAPI environment variable in Vercel" });
    }

    try {
        // Optional pre-check: Request conversion from the endpoint
        const response = await fetch(`https://youtube-mp36.p.rapidapi.com/v1/social/youtube/audio`, {
            method: 'POST',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                url: url,
                quality: '320kbps',
                ext: 'm4a' 
            })
        });

        // If the upstream host returned an HTML timeout page instead of JSON
        const contentType = response.headers.get("content-type");
        if (response.status === 504 || (contentType && contentType.includes("text/html"))) {
            return res.status(504).json({
                success: false,
                error: "The video server timed out while processing this file. The video is likely too long to convert in real time. Please try a video under 20 minutes."
            });
        }

        const data = await response.json();

        // Check if downstream API indicated a missing resource/endpoint
        if (data.message && data.message.includes("doesn't exists")) {
            return res.status(404).json({
                success: false,
                error: "API routing error. Please ensure subscription to the active endpoint.",
                rawApiResponse: data
            });
        }

        const downloadUrl = data.linkDownload || data.linkDownloadProgress || data.link;

        if (!downloadUrl || data.error === "true" || data.error === true) {
            return res.status(500).json({ 
                success: false, 
                error: data.msg || "Could not retrieve 320kbps download link from provider.", 
                apiStatus: response.status,
                rawApiResponse: data 
            });
        }

        return res.status(200).json({ 
            success: true, 
            title: data.title || "Audio Download (M4A)", 
            link: downloadUrl 
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Server error: " + error.message });
    }
}
