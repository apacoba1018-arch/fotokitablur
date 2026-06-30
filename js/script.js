// Inisialisasi Elemen DOM
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start_btn');
const statusMessage = document.getElementById('status_message');
const clockDisplay = document.getElementById('clock_display');
const mirrorToggle = document.getElementById('mirror_toggle');
const mirrorDot = document.getElementById('mirror_dot');
const countdownOverlay = document.getElementById('countdown_overlay');
const countdownText = document.getElementById('countdown_text');
const audioStatus = document.getElementById('audio_status');
const bgMusic = document.getElementById('bg_music');

let isModelLoaded = false;
let isTrendActive = false;

// 1. JAM DIGITAL REAL-TIME
setInterval(() => {
    const now = new Date();
    clockDisplay.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
}, 1000);

// 2. LOGIKA TOGGLE MIRROR
mirrorToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        canvasElement.style.transform = 'scaleX(-1)';
        mirrorDot.classList.add('translate-x-4');
    } else {
        canvasElement.style.transform = 'scaleX(1)';
        mirrorDot.classList.remove('translate-x-4');
    }
});

// 3. PENGKONDISIAN KESIAPAN SISTEM
function checkReadyState() {
    if (isModelLoaded) {
        startBtn.disabled = false;
        audioStatus.textContent = "Sistem Aktif! Pastikan 'lagu.mp3' ada di folder ini. ✨";
    }
}

// 4. LOGIKA TOMBOL KETIKA AUDIO SELESAI DIPUTAR
bgMusic.addEventListener('ended', () => {
    isTrendActive = false;
    startBtn.disabled = false;
    startBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg> Ulangi Trend`;
    startBtn.className = startBtn.className.replace('from-green-600 to-emerald-600', 'from-pink-600 to-rose-600');
    startBtn.className = startBtn.className.replace('hover:from-green-500 hover:to-emerald-500', 'hover:from-pink-500 hover:to-rose-500');
});

// 5. PEMROSESAN AI MEDIAPIPE HANDS
function onResults(results) {
    if (!isModelLoaded) {
        isModelLoaded = true;
        statusMessage.classList.add('hidden');
        canvasElement.classList.remove('hidden');
        checkReadyState();
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    let vSignDetected = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            // Logika Deteksi Pose V (Peace Sign)
            const indexUp = landmarks[8].y < landmarks[6].y;
            const middleUp = landmarks[12].y < landmarks[10].y;
            const ringDown = landmarks[16].y > landmarks[14].y;
            const pinkyDown = landmarks[20].y > landmarks[18].y;
            
            if (indexUp && middleUp && ringDown && pinkyDown) {
                vSignDetected = true;
            }
        }
    }

    // Terapkan Efek Blur jika Musik Aktif dan Pose V Terdeteksi
    if (isTrendActive && vSignDetected) {
        canvasCtx.filter = 'blur(30px) brightness(0.75) contrast(1.1)';
    } else {
        canvasCtx.filter = 'none';
    }

    // Gambar frame dari kamera ke canvas
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.restore();
}

// Konfigurasi MediaPipe
const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.55
});
hands.onResults(onResults);

// Inisialisasi Kamera Utilitas
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 1280,
    height: 720
});

camera.start().catch(err => {
    statusMessage.textContent = "Gagal mengakses kamera. Harap izinkan akses kamera pada browser Anda.";
    statusMessage.classList.replace('text-white', 'text-red-400');
    console.error("Camera error: ", err);
});

// 6. TOMBOL MULAI & COUNTDOWN TIMING
startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    countdownOverlay.classList.remove('hidden');
    
    let count = 3;
    countdownText.textContent = count;
    
    // Picu animasi pop awal
    countdownText.classList.remove('animate-pop');
    void countdownText.offsetWidth; // Force Reflow
    countdownText.classList.add('animate-pop');

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
            countdownText.classList.remove('animate-pop');
            void countdownText.offsetWidth; // Force Reflow
            countdownText.classList.add('animate-pop');
        } else {
            countdownInterval && clearInterval(countdownInterval);
            countdownOverlay.classList.add('hidden');
            
            // Aktifkan Efek Musik Lokal dan Deteksi Filter
            isTrendActive = true;
            bgMusic.currentTime = 0;
            
            bgMusic.play().catch(err => {
                console.error("Audio playback failed:", err);
                alert("Peringatan: File 'lagu.mp3' tidak ditemukan atau gagal diputar! Pastikan Anda sudah menaruh file audio tersebut tepat di dalam folder yang sama dengan index.html.");
                
                // Reset tombol jika audio gagal
                bgMusic.dispatchEvent(new Event('ended'));
            });
            
            startBtn.textContent = "Trend Berjalan... 🎶";
            startBtn.className = startBtn.className.replace('from-pink-600 to-rose-600', 'from-green-600 to-emerald-600');
            startBtn.className = startBtn.className.replace('hover:from-pink-500 hover:to-rose-500', 'hover:from-green-500 hover:to-emerald-500');
        }
    }, 1000);
});
