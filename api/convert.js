export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    const videoId = match ? match[1] : null;

    if (!videoId) return res.status(400).json({ error: "Invalid URL" });

    try {
        const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
            method: 'GET',
            headers: {
                // PASTE YOUR REAL RAPIDAPI KEY HERE
                'x-rapidapi-key': 'PASTE_YOUR_LONG_KEY_HERE', 
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
            }
        });

        const data = await response.json();

        // This ensures your frontend gets the correct data
        if (data.status === 'ok' || data.link) {
            return res.status(200).json({
                success: true,
                title: data.title,
                link: data.link
            });
        } else {
            throw new Error(data.msg || "Conversion failed");
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
```eof
