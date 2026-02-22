// --- Sound Engine ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    switch(type) {
        case 'click':
            osc.type = 'sine'; osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.03);
            break;
        case 'rolling':
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.05);
            break;
        case 'pop':
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.04);
            break;
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        }
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeToggle.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // Sound setup
    document.querySelectorAll('button, a, input, .tab-btn').forEach(el => {
        el.addEventListener('click', () => playSound('click'));
    });

    // Page routing
    if (document.getElementById('tab-auto')) initLottoTool();
    if (document.getElementById('results-body')) initResultsHistory();
});

// --- Lotto Tool Logic (Index) ---
function initLottoTool() {
    const tabAuto = document.getElementById('tab-auto');
    const tabManual = document.getElementById('tab-manual');
    const viewAuto = document.getElementById('view-auto');
    const viewManual = document.getElementById('view-manual');
    const btnGenerateAuto = document.getElementById('btn-generate-auto');
    const btnAnalyzeManual = document.getElementById('btn-analyze-manual');
    
    if (!tabAuto || !btnGenerateAuto) return;

    tabAuto.addEventListener('click', () => {
        tabAuto.classList.add('active'); tabManual.classList.remove('active');
        viewAuto.style.display = 'block'; viewManual.style.display = 'none';
        document.getElementById('analysis-report').style.display = 'none';
    });

    tabManual.addEventListener('click', () => {
        tabManual.classList.add('active'); tabAuto.classList.remove('active');
        viewManual.style.display = 'block'; viewAuto.style.display = 'none';
        document.getElementById('analysis-report').style.display = 'none';
    });

    btnGenerateAuto.addEventListener('click', async () => {
        btnGenerateAuto.disabled = true; btnGenerateAuto.textContent = '추출 중...';
        const display = document.getElementById('auto-numbers-display');
        display.innerHTML = '';
        document.getElementById('analysis-report').style.display = 'none';

        const numbers = Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b);
        const balls = [];
        for (let i = 0; i < 6; i++) {
            const ball = document.createElement('div'); ball.className = 'number spinning'; ball.textContent = '?';
            display.appendChild(ball); balls.push(ball);
        }

        for (let i = 0; i < 6; i++) {
            const ball = balls[i]; const val = numbers[i];
            const interval = setInterval(() => { ball.textContent = Math.floor(Math.random()*45)+1; playSound('rolling'); }, 80);
            await new Promise(r => setTimeout(r, 400 + (i * 150)));
            clearInterval(interval);
            ball.className = `number ${getBallColorClass(val)}`; ball.textContent = val; playSound('pop');
        }

        runProfessionalAnalysis(numbers, '추천 번호');
        btnGenerateAuto.disabled = false; btnGenerateAuto.textContent = '번호 추출 시작 ✨';
    });

    btnAnalyzeManual.addEventListener('click', () => {
        const inputs = document.querySelectorAll('.manual-inputs input');
        const numbers = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (numbers.length < 6) { alert('6개의 번호를 모두 입력해주세요!'); return; }
        runProfessionalAnalysis(numbers.sort((a,b)=>a-b), '입력 번호');
    });
}

// --- Results History Logic ---
const BASE_ROUND = 1153; 
async function initResultsHistory() {
    const resultsBody = document.getElementById('results-body');
    const loadingSpinner = document.getElementById('loading-spinner');
    const btnLoadMore = document.getElementById('btn-load-more');
    
    // 1. Find the latest available round
    const today = new Date();
    const startDate = new Date(2025, 0, 4); 
    const weeksDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 7));
    let estimatedRound = BASE_ROUND + weeksDiff;

    loadingSpinner.innerHTML = `<p>데이터 서버(DH)에서 정보를 가져오는 중입니다... 🔄</p>`;
    
    // 2. Load first batch
    let successCount = 0;
    let r = estimatedRound;
    while (successCount < 8 && r >= BASE_ROUND) {
        const data = await fetchLottoData(r);
        if (data && data.returnValue === "success") {
            appendRow(data);
            successCount++;
        }
        r--;
    }
    
    loadingSpinner.style.display = 'none';
    btnLoadMore.style.display = 'inline-block';
    
    btnLoadMore.addEventListener('click', async () => {
        btnLoadMore.disabled = true;
        const lastR = parseInt(resultsBody.lastElementChild.dataset.round) - 1;
        let batchCount = 0;
        let currentR = lastR;
        while (batchCount < 8 && currentR >= BASE_ROUND) {
            const data = await fetchLottoData(currentR);
            if (data && data.returnValue === "success") {
                appendRow(data);
                batchCount++;
            }
            currentR--;
        }
        btnLoadMore.disabled = false;
    });
}

async function fetchLottoData(round) {
    try {
        const target = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
        const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(target)}`);
        return await response.json();
    } catch (e) {
        return null;
    }
}

function appendRow(data) {
    const resultsBody = document.getElementById('results-body');
    const row = document.createElement('tr');
    row.dataset.round = data.drwNo;
    
    const numbers = [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6];
    const numsHtml = numbers.map(n => `<div class="number ${getBallColorClass(n)}">${n}</div>`).join('');
    const bonusHtml = `<div class="number ${getBallColorClass(data.bnusNo)}">${data.bnusNo}</div>`;
    const prize = new Intl.NumberFormat('ko-KR').format(data.firstWinamnt);
    const sales = new Intl.NumberFormat('ko-KR').format(data.totSellamnt);
    
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    let grade = (sum >= 100 && sum <= 170 && odds >= 2 && odds <= 4) ? 
                {l:'최적 밸런스', c:'grade-opt'} : {l:'안정적 표준', c:'grade-std'};

    row.innerHTML = `
        <td><strong>${data.drwNo}회</strong></td>
        <td><small>${data.drwNoDate}</small></td>
        <td><div style="display:flex;align-items:center;justify-content:center;gap:5px;">
            <div class="numbers-display">${numsHtml}</div><span style="color:#aaa;font-weight:800">+</span>
            <div class="numbers-display">${bonusHtml}</div>
        </div></td>
        <td><div class="prize-info"><span class="winner-count">${data.firstPrzwnerCo}명</span><br><span class="prize-amount">${prize}원</span></div></td>
        <td><small style="color:#888">${sales}원</small></td>
        <td><span class="grade-badge ${grade.c}">${grade.l}</span></td>
    `;
    resultsBody.appendChild(row);
}

function getBallColorClass(val) {
    if (val <= 10) return 'num-1-10'; if (val <= 20) return 'num-11-20';
    if (val <= 30) return 'num-21-30'; if (val <= 40) return 'num-31-40';
    return 'num-41-45';
}

function runProfessionalAnalysis(numbers, type) {
    const reportSection = document.getElementById('analysis-report');
    if (!reportSection) return;
    reportSection.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = `${type}: ${numbers.join(', ')}`;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const highs = numbers.filter(n => n >= 23).length;
    let pts = 0;
    if (sum >= 100 && sum <= 170) pts++; if (odds >= 2 && odds <= 4) pts++; if (highs >= 2 && highs <= 4) pts++;
    
    let grade = pts === 3 ? "최적의 통계적 밸런스" : pts === 2 ? "안정적인 표준 조합" : "도전적인 변칙 패턴";
    let icon = pts === 3 ? "⚖️" : pts === 2 ? "✅" : "🚀";

    document.getElementById('pattern-grade').textContent = grade;
    document.getElementById('status-icon').textContent = icon;
    document.getElementById('val-sum').textContent = sum;
    document.getElementById('val-odd-even').textContent = `${odds}:${6-odds}`;
    document.getElementById('val-high-low').textContent = `${highs}:${6-highs}`; 
    document.getElementById('val-consecutive').textContent = `분석 완료`;
    reportSection.scrollIntoView({ behavior: 'smooth' });
}