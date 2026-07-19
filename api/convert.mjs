<!DOCTYPE html>
<html lang="en">
<head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZLH78P4Y00"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-ZLH78P4Y00');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SonicGrab | High-Quality YouTube to MP3 Converter</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; }
        .glass { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(16px); }
    </style>
</head>
<body class="bg-slate-950 text-slate-200 min-h-screen">
    <nav class="max-w-4xl mx-auto p-6 flex justify-between items-center">
        <a href="#" class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">SonicGrab</a>
    </nav>
    
    <main class="max-w-4xl mx-auto px-6 pb-20">
        <section class="glass p-8 md:p-12 rounded-[2rem] border border-slate-800 shadow-2xl mb-16">
            <h1 class="text-3xl md:text-5xl font-extrabold text-white mb-4">YouTube to MP3 Converter</h1>
            <p class="text-slate-400 mb-8">Convert YouTube videos to high-quality 320kbps MP3 files instantly.</p>
            
            <div id="converterBox" class="flex flex-col gap-4">
                <div id="inputForm" class="flex flex-col gap-4">
                    <input type="text" id="urlInput" placeholder="Paste YouTube video URL here..." class="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-indigo-500 transition-all text-lg text-white">
                    <button id="convertBtn" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg text-lg">
                        Start Conversion
                    </button>
                </div>
                
                <div id="processingState" class="hidden flex flex-col items-center justify-center py-6 gap-4">
                    <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-lg font-semibold text-white">Extracting Audio...</p>
                </div>
                
                <div id="successCard" class="hidden bg-slate-900/80 border border-emerald-500/20 p-6 rounded-2xl">
                    <p id="videoTitle" class="text-lg font-bold text-white mb-4">Title</p>
                    <button id="downloadBtn" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">Download MP3</button>
                    <button id="resetBtn" class="w-full mt-3 text-slate-400 hover:text-white">Convert Another</button>
                </div>
                
                <div id="errorBanner" class="hidden bg-red-950/40 border border-red-500/30 p-4 rounded-xl text-red-300">
                    <span id="errorText"></span>
                </div>
            </div>
        </section>
    </main>

    <script>
        const convertBtn = document.getElementById('convertBtn');
        const urlInput = document.getElementById('urlInput');
        
        convertBtn.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            if (!url) return;
            
            // UI State
            document.getElementById('inputForm').classList.add('hidden');
            document.getElementById('processingState').classList.remove('hidden');
            document.getElementById('errorBanner').classList.add('hidden');

            try {
                // Ensure request is POST and contains JSON
                const response = await fetch('/api/convert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url })
                });

                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error || 'Server error');
                
                document.getElementById('videoTitle').textContent = data.title;
                window.downloadLink = data.link;
                
                document.getElementById('processingState').classList.add('hidden');
                document.getElementById('successCard').classList.remove('hidden');
            } catch (err) {
                document.getElementById('errorText').textContent = err.message;
                document.getElementById('errorBanner').classList.remove('hidden');
                document.getElementById('processingState').classList.add('hidden');
                document.getElementById('inputForm').classList.remove('hidden');
            }
        });

        document.getElementById('downloadBtn').onclick = () => window.open(window.downloadLink, '_blank');
        document.getElementById('resetBtn').onclick = () => {
            document.getElementById('successCard').classList.add('hidden');
            document.getElementById('inputForm').classList.remove('hidden');
        };
    </script>
</body>
</html>
