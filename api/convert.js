export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { url } = req.body;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    const videoId = match ? match[1] : null;

    if (!videoId) {
        return res.status(400).json({ success: false, error: "Invalid URL" });
    }

    if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ success: false, error: "Configuration error" });
    }

    const fetchWithRetry = async (id, retries = 5) => {
        for (let i = 0; i < retries; i++) {
            const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${id}`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
                }
            });

            const data = await response.json();
            
            if (data.status === 'ok') return data;
            if (data.status === 'processing') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }
            throw new Error(data.msg || "Conversion failed");
        }
        throw new Error("Conversion timed out. Please try again.");
    };

    try {
        const result = await fetchWithRetry(videoId);
        return res.status(200).json({ success: true, title: result.title, link: result.link });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
```eof
