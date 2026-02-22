// --- Sound Engine ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    if(type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.03);
    } else if(type === 'pop') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }
    document.querySelectorAll('button, a, .tab-btn').forEach(el => {
        el.addEventListener('click', () => playSound('click'));
    });

    // Routing
    if (document.getElementById('tab-auto')) {
        initLottoTool();
        calculateRealtimeTrend(); 
    }
    if (document.getElementById('results-body')) initResultsHistory();
    if (document.getElementById('probability-grid')) initProbabilityAnalysis();
});

// --- Home & Tool Logic (Existing logic preserved) ---
function initLottoTool() {
    const tabAuto = document.getElementById('tab-auto'), tabManual = document.getElementById('tab-manual');
    const viewAuto = document.getElementById('view-auto'), viewManual = document.getElementById('view-manual');
    const btnGen = document.getElementById('btn-generate-auto'), btnAnlz = document.getElementById('btn-analyze-manual');
    const display = document.getElementById('auto-numbers-display');

    tabAuto.onclick = () => { tabAuto.className='tab-btn active'; tabManual.className='tab-btn'; viewAuto.style.display='block'; viewManual.style.display='none'; };
    tabManual.onclick = () => { tabManual.className='tab-btn active'; tabAuto.className='tab-btn'; viewManual.style.display='block'; viewAuto.style.display='none'; setupManualInputs(); };

    btnGen.onclick = async () => {
        btnGen.disabled = true; display.innerHTML = '';
        const nums = Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b);
        for (let n of nums) {
            const ball = document.createElement('div');
            ball.className = `number ${getBallColorClass(n)}`; ball.textContent = n;
            display.appendChild(ball); playSound('pop');
            await new Promise(r => setTimeout(r, 300));
        }
        btnGen.disabled = false;
        runProfessionalAnalysis(nums);
    };
}

// --- NEW: Probability Detailed Analysis Logic ---
async function initProbabilityAnalysis() {
    const grid = document.getElementById('probability-grid');
    const topDisplay = document.getElementById('top-expected-numbers');
    
    // 1. Fetch 5 weeks data
    const baseDate = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - baseDate) / (1000*60*60*24*7));
    let r = 1153 + weeksDiff;
    let recentGames = [];

    while (recentGames.length < 5 && r > 1150) {
        try {
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r}`)}`);
            const data = await response.json();
            if (data && data.returnValue === "success") {
                recentGames.push([data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6]);
            }
        } catch (e) {}
        r--;
        await new Promise(res => setTimeout(res, 100));
    }

    // 2. Calculate Probabilities
    const stats = {};
    for (let i = 1; i <= 45; i++) stats[i] = { freq: 0, lastSeen: 6, score: 0 };

    recentGames.forEach((nums, idx) => {
        const recency = idx; // 0 is latest
        nums.forEach(n => {
            stats[n].freq++;
            if (stats[n].lastSeen > recency) stats[n].lastSeen = recency;
        });
    });

    // Scoring Algorithm: freq(40%) + recency(40%) + random jitter(20%)
    for (let i = 1; i <= 45; i++) {
        const freqScore = (stats[i].freq / 5) * 40;
        const recencyScore = ((5 - stats[i].lastSeen) / 5) * 40;
        const jitter = Math.random() * 20;
        stats[i].score = Math.round(freqScore + recencyScore + jitter);
    }

    // 3. Render Grid
    grid.innerHTML = '';
    const sortedStats = Object.entries(stats).sort((a, b) => b[1].score - a[1].score);
    
    for (let i = 1; i <= 45; i++) {
        const s = stats[i];
        const card = document.createElement('div');
        let color = '#74b9ff'; // Cold
        if (s.score > 60) color = '#ff7675'; // Hot
        else if (s.score > 30) color = '#fdcb6e'; // Normal

        card.innerHTML = `
            <div style="background: ${color}; color: white; padding: 10px; border-radius: 12px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <div style="font-size: 1.2rem; font-weight: 900;">${i}</div>
                <div style="font-size: 0.7rem; font-weight: 700; opacity: 0.9;">${s.score}%</div>
            </div>
        `;
        grid.appendChild(card);
    }

    // 4. Render Top 6
    topDisplay.innerHTML = '';
    const top6 = sortedStats.slice(0, 6).map(item => parseInt(item[0])).sort((a, b) => a - b);
    top6.forEach(n => {
        const ball = document.createElement('div');
        ball.className = `number ${getBallColorClass(n)}`;
        ball.textContent = n;
        topDisplay.appendChild(ball);
    });
}

// (Rest of the helper functions: getBallColorClass, calculateRealtimeTrend, etc. same as before)
async function calculateRealtimeTrend() {
    const trendRange = document.getElementById('trend-range');
    const trendNumber = document.getElementById('trend-number');
    const trendOddEven = document.getElementById('trend-odd-even');
    if (!trendRange) return;
    const baseDate = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - baseDate) / (1000*60*60*24*7));
    let r = 1153 + weeksDiff;
    let recentNumbers = [];
    while (recentNumbers.length < 5 && r > 1150) {
        try {
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r}`)}`);
            const data = await response.json();
            if (data && data.returnValue === "success") {
                recentNumbers.push([data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6]);
            }
        } catch (e) {}
        r--;
        await new Promise(res => setTimeout(res, 100));
    }
    if (recentNumbers.length > 0) {
        const flatNums = recentNumbers.flat();
        const rangeStats = { '10번대미만': 0, '10번대': 0, '20번대': 0, '30번대': 0, '40번대': 0 };
        const numFreq = {};
        let totalOdds = 0;
        flatNums.forEach(n => {
            if (n <= 10) rangeStats['10번대미만']++; else if (n <= 20) rangeStats['10번대']++; else if (n <= 30) rangeStats['20번대']++; else if (n <= 40) rangeStats['30번대']++; else rangeStats['40번대']++;
            numFreq[n] = (numFreq[n] || 0) + 1; if (n % 2 !== 0) totalOdds++;
        });
        const hottestRange = Object.keys(rangeStats).reduce((a, b) => rangeStats[a] > rangeStats[b] ? a : b);
        const hottestNum = Object.keys(numFreq).reduce((a, b) => numFreq[a] > numFreq[b] ? a : b);
        const avgOdds = Math.round((totalOdds / (recentNumbers.length * 6)) * 6);
        trendRange.textContent = hottestRange;
        trendNumber.textContent = `${hottestNum}번 (${numFreq[hottestNum]}회)`;
        trendOddEven.textContent = `${avgOdds} : ${6 - avgOdds}`;
    }
}

function getBallColorClass(val) {
    if (val <= 10) return 'num-1-10'; if (val <= 20) return 'num-11-20'; if (val <= 30) return 'num-21-30'; if (val <= 40) return 'num-31-40';
    return 'num-41-45';
}

function runProfessionalAnalysis(numbers) {
    const report = document.getElementById('analysis-report');
    if (!report) return;
    report.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = numbers.join(', ');
}

function setupManualInputs() {
    const inputs = document.querySelectorAll('.manual-inputs input');
    inputs.forEach(input => {
        input.className = 'manual-input';
        input.oninput = () => {
            const val = parseInt(input.value);
            input.classList.remove('filled-1', 'filled-2', 'filled-3', 'filled-4', 'filled-5');
            if (val >= 1 && val <= 45) {
                if (val <= 10) input.classList.add('filled-1');
                else if (val <= 20) input.classList.add('filled-2');
                else if (val <= 30) input.classList.add('filled-3');
                else if (val <= 40) input.classList.add('filled-4');
                else input.classList.add('filled-5');
            }
        };
    });
}

async function initResultsHistory() {
    const body = document.getElementById('results-body');
    const start = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - start) / (1000*60*60*24*7));
    let round = 1153 + weeksDiff;
    let loaded = 0;
    while (loaded < 8 && round > 1150) {
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`)}`;
            const response = await fetch(proxyUrl);
            const rawData = await response.json();
            const data = typeof rawData.contents === 'string' ? JSON.parse(rawData.contents) : rawData.contents;
            if (data && data.returnValue === "success") {
                appendHistoryRow(data);
                loaded++;
            }
        } catch (e) {}
        round--;
        await new Promise(r => setTimeout(r, 200));
    }
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'none';
}

function appendHistoryRow(d) {
    const body = document.getElementById('results-body');
    if (!body) return;
    const row = document.createElement('tr');
    const nums = [d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6];
    const numsHtml = nums.map(n => `<div class="number ${getBallColorClass(n)}" style="width:32px;height:32px;font-size:0.8rem;border-radius:8px;">${n}</div>`).join('');
    const prize = new Intl.NumberFormat('ko-KR').format(d.firstWinamnt);
    row.innerHTML = `<td><strong>${d.drwNo}</strong></td><td><small>${d.drwNoDate}</small></td><td><div class="numbers-display" style="margin:0;gap:4px;">${numsHtml} <span style="color:#ccc">+</span> <div class="number ${getBallColorClass(d.bnusNo)}" style="width:32px;height:32px;font-size:0.8rem;border-radius:8px;">${d.bnusNo}</div></div></td><td><small>${d.firstPrzwnerCo}명<br>${prize}원</small></td><td><span class="grade-badge grade-opt">최적</span></td>`;
    body.appendChild(row);
}