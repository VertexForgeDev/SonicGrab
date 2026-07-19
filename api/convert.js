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

        const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
                // Removed Content-Type: application/json because it is not needed for GET
            }
        });

        const data = await response.json();

        if (data && data.link) {
            return res.status(200).json({
                success: true,
                title: data.title,
                link: data.link
            });
        }
        
        return res.status(500).json({ success: false, error: "Conversion failed" });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
```eof
