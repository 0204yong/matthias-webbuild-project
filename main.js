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
    } else if(type === 'rolling') {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine'; osc2.frequency.setValueAtTime(60, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc2.connect(gain2); gain2.connect(audioCtx.destination);
        osc2.start(); osc2.stop(audioCtx.currentTime + 0.1);
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

    if (document.getElementById('tab-auto')) {
        initLottoTool();
        calculateRealtimeTrend(); 
    }
    if (document.getElementById('results-body')) initResultsHistory();
    if (document.getElementById('probability-grid')) initProbabilityAnalysis();
});

// --- Home Tool Logic ---
function initLottoTool() {
    const tabAuto = document.getElementById('tab-auto'), tabManual = document.getElementById('tab-manual');
    const viewAuto = document.getElementById('view-auto'), viewManual = document.getElementById('view-manual');
    const btnGen = document.getElementById('btn-generate-auto'), btnAnlz = document.getElementById('btn-analyze-manual');
    const autoDisplay = document.getElementById('auto-numbers-display');

    tabAuto.onclick = () => { tabAuto.className='tab-btn active'; tabManual.className='tab-btn'; viewAuto.style.display='block'; viewManual.style.display='none'; };
    tabManual.onclick = () => { tabManual.className='tab-btn active'; tabAuto.className='tab-btn'; viewManual.style.display='block'; viewAuto.style.display='none'; setupManualInputs(); };

    btnGen.onclick = async () => {
        btnGen.disabled = true; autoDisplay.innerHTML = '';
        document.getElementById('analysis-report').style.display = 'none';
        const finalNums = Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b);
        for (let i = 0; i < 6; i++) {
            const ball = document.createElement('div');
            ball.className = 'number spinning'; ball.textContent = '?';
            autoDisplay.appendChild(ball);
        }
        const balls = autoDisplay.querySelectorAll('.number');
        for (let i = 0; i < 6; i++) {
            const interval = setInterval(() => { balls[i].textContent = Math.floor(Math.random()*45)+1; playSound('rolling'); }, 100);
            await new Promise(r => setTimeout(r, 500 + (i * 300)));
            clearInterval(interval);
            balls[i].className = `number ${getBallColorClass(finalNums[i])}`;
            balls[i].textContent = finalNums[i]; playSound('pop');
        }
        runProfessionalAnalysis(finalNums);
        btnGen.disabled = false;
    };

    btnAnlz.onclick = () => {
        const inputs = document.querySelectorAll('.manual-inputs input');
        const nums = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (nums.length < 6) return alert('6개의 번호를 모두 입력해주세요!');
        runProfessionalAnalysis(nums.sort((a,b)=>a-b), true);
    };
}

// --- Trend Analytics ---
async function calculateRealtimeTrend() {
    const tRange = document.getElementById('trend-range'), tNum = document.getElementById('trend-number'), tOE = document.getElementById('trend-odd-even');
    if (!tRange) return;
    tRange.textContent = "20번대 강세"; tNum.textContent = "27번 (3회)"; tOE.textContent = "3 : 3";

    const baseDate = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - baseDate) / (1000*60*60*24*7));
    let r = 1153 + weeksDiff;
    let games = [];
    for (let i = 0; i < 5; i++) {
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r-i}`)}`);
            const data = JSON.parse((await res.json()).contents);
            if (data && data.returnValue === "success") {
                games.push([data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6]);
                updateTrendUI(games);
            }
        } catch (e) {}
    }
}

function updateTrendUI(games) {
    const flat = games.flat();
    const ranges = { '10번대미만': 0, '10번대': 0, '20번대': 0, '30번대': 0, '40번대': 0 };
    const freqs = {}; let odds = 0;
    flat.forEach(n => {
        if (n <= 10) ranges['10번대미만']++; else if (n <= 20) ranges['10번대']++; else if (n <= 30) ranges['20번대']++; else if (n <= 40) ranges['30번대']++; else ranges['40번대']++;
        freqs[n] = (freqs[n] || 0) + 1; if (n % 2 !== 0) odds++;
    });
    const hRange = Object.keys(ranges).reduce((a, b) => ranges[a] > ranges[b] ? a : b);
    const hNum = Object.keys(freqs).reduce((a, b) => freqs[a] > freqs[b] ? a : b);
    const ratio = Math.round((odds / flat.length) * 6);
    document.getElementById('trend-range').textContent = hRange;
    document.getElementById('trend-number').textContent = `${hNum}번 (${freqs[hNum]}회)`;
    document.getElementById('trend-odd-even').textContent = `${ratio} : ${6 - ratio}`;
}

// --- Probability Detail Fix ---
async function initProbabilityAnalysis() {
    const grid = document.getElementById('probability-grid');
    const topDisplay = document.getElementById('top-expected-numbers');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;">최신 빅데이터 분석 중... 🔄</div>';

    const baseDate = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - baseDate) / (1000*60*60*24*7));
    let r = 1153 + weeksDiff;
    let recentGames = [];

    // 데이터 5개를 찾을 때까지 탐색
    for (let i = 0; i < 8; i++) {
        if (recentGames.length >= 5) break;
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r-i}`)}`);
            const data = JSON.parse((await res.json()).contents);
            if (data && data.returnValue === "success") {
                recentGames.push([data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6]);
            }
        } catch (e) {}
    }

    const stats = {};
    for (let i = 1; i <= 45; i++) stats[i] = { freq: 0, lastSeen: 6, score: 0 };

    if (recentGames.length > 0) {
        recentGames.forEach((nums, idx) => {
            nums.forEach(n => {
                stats[n].freq++;
                if (stats[n].lastSeen > idx) stats[n].lastSeen = idx;
            });
        });
        for (let i = 1; i <= 45; i++) {
            const fS = (stats[i].freq / 3) * 50;
            const rS = ((5 - stats[i].lastSeen) / 5) * 40;
            stats[i].score = Math.min(Math.round(fS + rS + Math.random() * 10), 100);
        }
    } else {
        // 데이터 실패 시 시뮬레이션 데이터
        for (let i = 1; i <= 45; i++) stats[i].score = Math.floor(Math.random() * 50) + 30;
    }

    grid.innerHTML = '';
    for (let i = 1; i <= 45; i++) {
        const s = stats[i];
        const colorClass = s.score >= 70 ? 'prob-hot' : s.score >= 40 ? 'prob-normal' : 'prob-cold';
        const card = document.createElement('div');
        card.innerHTML = `<div class="prob-card ${colorClass}" style="padding:15px; border-radius:15px; text-align:center; color:white;"><div style="font-size:1.4rem; font-weight:900;">${i}</div><div style="font-size:0.8rem; font-weight:700; opacity:0.9;">${s.score}%</div></div>`;
        grid.appendChild(card);
    }

    if (topDisplay) {
        topDisplay.innerHTML = '';
        const top6 = Object.entries(stats).sort((a,b) => b[1].score - a[1].score).slice(0,6).map(it => parseInt(it[0])).sort((a,b)=>a-b);
        top6.forEach(n => {
            const ball = document.createElement('div');
            ball.className = `number ${getBallColorClass(n)}`;
            ball.textContent = n;
            topDisplay.appendChild(ball);
        });
    }
}

function runProfessionalAnalysis(numbers, shouldScroll = false) {
    const report = document.getElementById('analysis-report');
    if (!report) return;
    report.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = numbers.join(', ');
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const highs = numbers.filter(n => n >= 23).length;
    let consecs = 0;
    for (let i = 0; i < numbers.length - 1; i++) if (numbers[i] + 1 === numbers[i+1]) consecs++;
    let pts = 0;
    if (sum >= 100 && sum <= 170) pts++; if (odds >= 2 && odds <= 4) pts++; if (highs >= 2 && highs <= 4) pts++; if (consecs <= 1) pts++;
    const grade = pts >= 4 ? "최적의 통계적 밸런스" : pts === 3 ? "안정적인 표준 조합" : "도전적인 변칙 패턴";
    document.getElementById('pattern-grade').textContent = grade;
    document.getElementById('val-sum').textContent = sum;
    document.getElementById('val-odd-even').textContent = `${odds}:${6-odds}`;
    document.getElementById('val-high-low').textContent = `${highs}:${6-highs}`; 
    document.getElementById('val-consecutive').textContent = `${consecs}회`;
    if (shouldScroll) report.scrollIntoView({ behavior: 'smooth' });
}

function getBallColorClass(val) {
    if (val <= 10) return 'num-1-10'; if (val <= 20) return 'num-11-20'; if (val <= 30) return 'num-21-30'; if (val <= 40) return 'num-31-40';
    return 'num-41-45';
}

function setupManualInputs() {
    const inputs = document.querySelectorAll('.manual-inputs input');
    inputs.forEach(input => {
        input.className = 'manual-input';
        input.oninput = () => {
            const val = parseInt(input.value);
            input.classList.remove('filled-1', 'filled-2', 'filled-3', 'filled-4', 'filled-5');
            if (val >= 1 && val <= 45) {
                if (val <= 10) input.classList.add('filled-1'); else if (val <= 20) input.classList.add('filled-2');
                else if (val <= 30) input.classList.add('filled-3'); else if (val <= 40) input.classList.add('filled-4'); else input.classList.add('filled-5');
            }
        };
    });
}

async function initResultsHistory() {
    const body = document.getElementById('results-body');
    if (!body) return;
    let r = 1153 + Math.floor((new Date() - new Date(2025, 0, 4)) / (1000*60*60*24*7));
    let count = 0;
    while (count < 8 && r > 1150) {
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r}`)}`);
            const data = JSON.parse((await res.json()).contents);
            if (data.returnValue === "success") {
                const row = document.createElement('tr');
                const prize = new Intl.NumberFormat('ko-KR').format(data.firstWinamnt);
                row.innerHTML = `<td>${data.drwNo}회</td><td>${data.drwNoDate}</td><td>${data.drwtNo1}, ${data.drwtNo2}, ${data.drwtNo3}, ${data.drwtNo4}, ${data.drwtNo5}, ${data.drwtNo6} + ${data.bnusNo}</td><td>${data.firstPrzwnerCo}명 / ${prize}원</td><td><span class="grade-badge grade-opt">최적</span></td>`;
                body.appendChild(row);
                count++;
            }
        } catch (e) {}
        r--;
    }
}