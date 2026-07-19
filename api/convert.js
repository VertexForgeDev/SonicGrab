export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { url } = req.body;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        const videoId = match ? match[1] : null;

        if (!videoId) return res.status(400).json({ success: false, error: "Invalid URL" });

        const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
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
            console.error("API returned non-JSON response:", text);
            return res.status(502).json({ success: false, error: "API returned an invalid format (check logs)" });
        }

        if (data.status === 'ok') {
            return res.status(200).json({ success: true, title: data.title, link: data.link });
        } else if (data.status === 'processing') {
            return res.status(202).json({ success: false, error: "Still processing, try again in 5 seconds" });
        }
        
        return res.status(500).json({ success: false, error: data.msg || "Conversion failed" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
```eof
