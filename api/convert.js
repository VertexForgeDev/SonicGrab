/* STREAMING_CHUNK:Updating API handler with environment debug logic... */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { url } = req.body;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        const videoId = match ? match[1] : null;

        if (!videoId) {
            return res.status(400).json({ success: false, error: "Invalid URL" });
        }

        // Debug log to check if key exists at runtime
        const apiKey = process.env.RAPIDAPI_KEY;
        if (!apiKey) {
            console.error("DEBUG: RAPIDAPI_KEY is undefined in environment");
            return res.status(500).json({ success: false, error: "Configuration error: API Key missing" });
        }

        const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
            }
        });

        // Get the raw text first to avoid JSON parse errors
        const responseText = await response.text();
        
        try {
            const data = JSON.parse(responseText);
            if (data && data.link) {
                return res.status(200).json({
                    success: true,
                    title: data.title,
                    link: data.link
                });
            }
            return res.status(500).json({ success: false, error: data.msg || "Conversion failed" });
        } catch (parseError) {
            console.error("Failed to parse API response. Raw response:", responseText);
            return res.status(500).json({ success: false, error: "External API error" });
        }

    } catch (error) {
        console.error("Internal Error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
```eof
