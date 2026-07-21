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

    // List of qualities/formats to attempt in order if 320kbps fails
    const payloadVariants = [
        { url: url, quality: '320kbps', ext: 'm4a' },
        { url: url, quality: '128kbps', ext: 'm4a' },
        { url: url, quality: '320kbps', ext: 'mp3' },
        { url: url, quality: '128kbps', ext: 'mp3' }
    ];

    let lastErrorData = null;

    for (const variant of payloadVariants) {
        try {
            const response = await fetch(`https://youtube-mp3-2025.p.rapidapi.com/v1/social/youtube/audio`, {
                method: 'POST',
                headers: {
                    'x-rapidapi-key': apiKey,
                    'x-rapidapi-host': 'youtube-mp3-2025.p.rapidapi.com',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                },
                body: JSON.stringify(variant)
            });

            // Handle upstream Gateway Timeout
            const contentType = response.headers.get("content-type");
            if (response.status === 504 || (contentType && contentType.includes("text/html"))) {
                return res.status(504).json({
                    success: false,
                    error: "The video server timed out while processing this file. The video is likely too long to convert in real time."
                });
            }

            const data = await response.json();

            // Check if rapidapi route was missing
            if (data.message && data.message.includes("doesn't exists")) {
                return res.status(404).json({
                    success: false,
                    error: "RapidAPI endpoint not found. Please verify your subscription to 'YouTube MP3 2025'.",
                    rawApiResponse: data
                });
            }

            const downloadUrl = data.linkDownload || data.linkDownloadProgress || data.link;

            // If we received a valid link, return immediately
            if (downloadUrl && data.error !== "true" && data.error !== true) {
                return res.status(200).json({ 
                    success: true, 
                    title: data.title || "Audio Download", 
                    link: downloadUrl 
                });
            }

            lastErrorData = data;
        } catch (e) {
            lastErrorData = { message: e.message };
        }
    }

    // If all payload variants fail
    return res.status(500).json({ 
        success: false, 
        error: "Could not retrieve download link. The video may be region-restricted or copyright-protected.", 
        rawApiResponse: lastErrorData 
    });
}
