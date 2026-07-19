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

    // This function handles the API calls with retries for "processing" status
    const fetchWithRetry = async (id, retries = 5) => {
        for (let i = 0; i < retries; i++) {
            const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${id}`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
                }
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Non-JSON Response from API:", text);
                throw new Error("API returned invalid data format");
            }

            if (data.status === 'ok') return data;
            if (data.status === 'processing') {
                await new Promise(resolve => setTimeout(resolve, 2500)); // Wait 2.5s
                continue;
            }
            throw new Error(data.msg || "Conversion failed on server");
        }
        throw new Error("Conversion timed out. Please try a different video.");
    };

    try {
        const result = await fetchWithRetry(videoId);
        return res.status(200).json({ success: true, title: result.title, link: result.link });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
```eof
