export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: "No URL provided" });
    }

    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    const videoId = match ? match[1] : null;

    if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL format." });
    }

    try {
        const options = {
            method: 'GET',
            headers: {
                // Ensure you have added RAPIDAPI_KEY to your Vercel Environment Variables.
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'YOUR_RAPIDAPI_KEY_HERE', 
                'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
            }
        };

        const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, options);
        const data = await response.json();

        if (data.status === 'fail' || !data.link) {
            throw new Error(data.msg || "API could not process this video. It may be blocked.");
        }

        return res.status(200).json({
            success: true,
            title: data.title || "YouTube Audio",
            link: data.link 
        });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Failed to communicate with the conversion server." 
        });
    }
}
