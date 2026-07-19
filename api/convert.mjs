export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "No URL provided" });

    // Keep the regex validation to ensure the URL is a real YouTube link before sending it to the API
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    const videoId = match ? match[1] : null;

    if (!videoId) return res.status(400).json({ success: false, error: "Invalid YouTube URL" });

    const apiKey = process.env.RAPIDAPI;
    if (!apiKey) {
        return res.status(500).json({ success: false, error: "Missing RAPIDAPI environment variable in Vercel" });
    }

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
                url: url,          // Pass the complete URL, not the videoId
                quality: '320kbps', // Set target audio resolution
                ext: 'm4a'          // Keep native container format
            })
        });

        const data = await response.json();

        // Handle structural error response objects
        if (data.message && data.message.includes("doesn't exists")) {
            return res.status(404).json({
                success: false,
                error: "Endpoint error. Verify your account is actively subscribed to YouTube MP3 2025 on RapidAPI.",
                rawApiResponse: data
            });
        }

        const downloadUrl = data.linkDownload || data.linkDownloadProgress || data.link;

        if (!downloadUrl || data.error === "true" || data.error === true) {
            return res.status(500).json({ 
                success: false, 
                error: "Could not retrieve download link from the API provider", 
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
