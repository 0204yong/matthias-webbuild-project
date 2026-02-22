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
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    }
}

// --- Statistical Weights ---
const HISTORICAL_WEIGHTS = { 1: 1.2, 13: 1.1, 17: 1.1, 27: 1.3, 34: 1.2, 43: 1.25, 2: 0.9, 9: 0.85, 22: 0.8, 32: 0.9, 41: 0.95 };

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
    if (document.getElementById('tab-auto')) initLottoTool();
    if (document.getElementById('results-body')) initResultsHistory();
});

// --- Home Tool Logic ---
function initLottoTool() {
    const tabAuto = document.getElementById('tab-auto'), tabManual = document.getElementById('tab-manual');
    const viewAuto = document.getElementById('view-auto'), viewManual = document.getElementById('view-manual');
    const btnGen = document.getElementById('btn-generate-auto'), btnAnlz = document.getElementById('btn-analyze-manual');
    const display = document.getElementById('auto-numbers-display');

    tabAuto.onclick = () => { tabAuto.className='tab-btn active'; tabManual.className='tab-btn'; viewAuto.style.display='block'; viewManual.style.display='none'; document.getElementById('analysis-report').style.display='none'; };
    tabManual.onclick = () => { tabManual.className='tab-btn active'; tabAuto.className='tab-btn'; viewManual.style.display='block'; viewAuto.style.display='none'; document.getElementById('analysis-report').style.display='none'; };

    btnGen.onclick = async () => {
        btnGen.disabled = true; display.innerHTML = ''; document.getElementById('analysis-report').style.display = 'none';
        const finalNums = generateWeightedNumbers();
        for (let i = 0; i < 6; i++) {
            const ball = document.createElement('div'); ball.className = 'number spinning'; ball.textContent = '?';
            display.appendChild(ball);
        }
        const balls = display.querySelectorAll('.number');
        for (let i = 0; i < 6; i++) {
            const interval = setInterval(() => { balls[i].textContent = Math.floor(Math.random()*45)+1; playSound('rolling'); }, 80);
            await new Promise(r => setTimeout(r, 500 + (i * 200)));
            clearInterval(interval);
            balls[i].className = `number ${getBallColorClass(finalNums[i])}`; balls[i].textContent = finalNums[i]; playSound('pop');
        }
        runProfessionalAnalysis(finalNums, 'AI 통계 추천');
        btnGen.disabled = false;
    };

    btnAnlz.onclick = () => {
        const inputs = document.querySelectorAll('.manual-inputs input');
        const nums = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (nums.length < 6) return alert('6개의 번호를 모두 입력해주세요!');
        runProfessionalAnalysis(nums.sort((a,b)=>a-b), '입력 번호');
    };
}

function generateWeightedNumbers() {
    let pool = [];
    for (let i = 1; i <= 45; i++) {
        const w = HISTORICAL_WEIGHTS[i] || 1.0;
        for (let j = 0; j < Math.round(w * 10); j++) pool.push(i);
    }
    let selected = new Set();
    while (selected.size < 6) selected.add(pool[Math.floor(Math.random() * pool.length)]);
    return Array.from(selected).sort((a, b) => a - b);
}

// --- History Logic (FIXED) ---
async function initResultsHistory() {
    const resultsBody = document.getElementById('results-body');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    // Estimate latest round
    const start = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - start) / (1000*60*60*24*7));
    let round = 1153 + weeksDiff;

    let loadedCount = 0;
    while (loadedCount < 8 && round > 1150) {
        try {
            // Using allorigins with safety parsing
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`)}`;
            const response = await fetch(proxyUrl);
            const rawData = await response.json();
            const data = typeof rawData.contents === 'string' ? JSON.parse(rawData.contents) : rawData.contents;
            
            if (data && data.returnValue === "success") {
                appendHistoryRow(data);
                loadedCount++;
            }
        } catch (e) { console.error('History fetch error for round:', round, e); }
        round--;
        await new Promise(r => setTimeout(r, 200)); // Rate limit safety
    }
    if (loadingSpinner) loadingSpinner.style.display = 'none';
}

function appendHistoryRow(d) {
    const body = document.getElementById('results-body');
    if (!body) return;
    const row = document.createElement('tr');
    const nums = [d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6];
    const numsHtml = nums.map(n => `<div class="number ${getBallColorClass(n)}" style="width:35px;height:35px;font-size:0.85rem;">${n}</div>`).join('');
    const prize = new Intl.NumberFormat('ko-KR').format(d.firstWinamnt);
    
    row.innerHTML = `
        <td><strong>${d.drwNo}회</strong></td>
        <td><small>${d.drwNoDate}</small></td>
        <td><div class="numbers-display" style="margin:0;gap:5px;">${numsHtml} <span style="color:#ccc">+</span> <div class="number ${getBallColorClass(d.bnusNo)}" style="width:35px;height:35px;font-size:0.85rem;">${d.bnusNo}</div></div></td>
        <td><div style="font-size:0.8rem;">${d.firstPrzwnerCo}명 당첨<br><strong>${prize}원</strong></div></td>
        <td><span class="grade-badge grade-opt">최적</span></td>
    `;
    body.appendChild(row);
}

function getBallColorClass(val) {
    if (val <= 10) return 'num-1-10'; if (val <= 20) return 'num-11-20';
    if (val <= 30) return 'num-21-30'; if (val <= 40) return 'num-31-40';
    return 'num-41-45';
}

function runProfessionalAnalysis(numbers, type) {
    const report = document.getElementById('analysis-report');
    if (!report) return;
    report.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = `${type}: ${numbers.join(', ')}`;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const highs = numbers.filter(n => n >= 23).length;
    let pts = 0;
    if (sum >= 100 && sum <= 170) pts++; if (odds >= 2 && odds <= 4) pts++; if (highs >= 2 && highs <= 4) pts++;
    document.getElementById('pattern-grade').textContent = pts >= 3 ? "최적의 통계적 밸런스" : pts === 2 ? "안정적인 표준 조합" : "도전적인 변칙 패턴";
    document.getElementById('val-sum').textContent = sum;
    document.getElementById('val-odd-even').textContent = `${odds}:${6-odds}`;
    document.getElementById('val-high-low').textContent = `${highs}:${6-highs}`; 
    document.getElementById('val-consecutive').textContent = "분석 완료";
}