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
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(60, audioCtx.currentTime);
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
    const display = document.getElementById('auto-numbers-display');

    tabAuto.onclick = () => { tabAuto.className='tab-btn active'; tabManual.className='tab-btn'; viewAuto.style.display='block'; viewManual.style.display='none'; };
    tabManual.onclick = () => { tabManual.className='tab-btn active'; tabAuto.className='tab-btn'; viewManual.style.display='block'; viewAuto.style.display='none'; setupManualInputs(); };

    btnGen.onclick = async () => {
        btnGen.disabled = true;
        display.innerHTML = '';
        document.getElementById('analysis-report').style.display = 'none';

        const finalNums = Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b);
        const balls = [];

        // 좌측부터 우측으로 순차 생성 보장
        for (let i = 0; i < 6; i++) {
            const ball = document.createElement('div');
            ball.className = 'number spinning';
            ball.textContent = '?';
            display.appendChild(ball);
            balls.push(ball);
        }

        for (let i = 0; i < 6; i++) {
            const ball = balls[i];
            const val = finalNums[i];
            const interval = setInterval(() => {
                ball.textContent = Math.floor(Math.random()*45)+1;
                playSound('rolling');
            }, 100);

            await new Promise(r => setTimeout(r, 500 + (i * 300))); // 생성 속도 및 방향성 강화
            clearInterval(interval);
            ball.className = `number ${getBallColorClass(val)}`;
            ball.textContent = val;
            playSound('pop');
        }

        runProfessionalAnalysis(finalNums);
        btnGen.disabled = false;
    };

    btnAnlz.onclick = () => {
        const inputs = document.querySelectorAll('.manual-inputs input');
        const nums = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (nums.length < 6) return alert('6개의 번호를 모두 입력해주세요!');
        if (new Set(nums).size !== 6) return alert('중복된 번호가 있습니다!');
        runProfessionalAnalysis(nums.sort((a,b)=>a-b));
    };
}

// --- Probability Detailed Analysis (Heatmap Color Fix) ---
async function initProbabilityAnalysis() {
    const grid = document.getElementById('probability-grid');
    const topDisplay = document.getElementById('top-expected-numbers');
    
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

    const stats = {};
    for (let i = 1; i <= 45; i++) stats[i] = { freq: 0, lastSeen: 6, score: 0 };

    recentGames.forEach((nums, idx) => {
        nums.forEach(n => {
            stats[n].freq++;
            if (stats[n].lastSeen > idx) stats[n].lastSeen = idx;
        });
    });

    // 변별력이 높은 점수 산정 알고리즘
    for (let i = 1; i <= 45; i++) {
        const freqScore = (stats[i].freq / 3) * 50; // 3회 이상 출현 시 만점
        const recencyScore = ((5 - stats[i].lastSeen) / 5) * 40;
        const jitter = Math.random() * 10;
        stats[i].score = Math.min(Math.round(freqScore + recencyScore + jitter), 100);
    }

    grid.innerHTML = '';
    const sortedStats = Object.entries(stats).sort((a, b) => b[1].score - a[1].score);
    
    for (let i = 1; i <= 45; i++) {
        const s = stats[i];
        const card = document.createElement('div');
        // 히트맵 색상 판정 로직 수정
        let colorClass = 'prob-cold';
        if (s.score >= 70) colorClass = 'prob-hot';
        else if (s.score >= 40) colorClass = 'prob-normal';

        card.innerHTML = `
            <div class="prob-card ${colorClass}" style="padding: 15px; border-radius: 15px; text-align: center; color: white;">
                <div style="font-size: 1.4rem; font-weight: 900;">${i}</div>
                <div style="font-size: 0.8rem; font-weight: 700; opacity: 0.9;">${s.score}%</div>
            </div>
        `;
        grid.appendChild(card);
    }

    topDisplay.innerHTML = '';
    const top6 = sortedStats.slice(0, 6).map(item => parseInt(item[0])).sort((a, b) => a - b);
    top6.forEach(n => {
        const ball = document.createElement('div');
        ball.className = `number ${getBallColorClass(n)}`;
        ball.textContent = n;
        topDisplay.appendChild(ball);
    });
}

function runProfessionalAnalysis(numbers) {
    const report = document.getElementById('analysis-report');
    if (!report) return;
    report.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = numbers.join(', ');
    
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const evens = 6 - odds;
    const highs = numbers.filter(n => n >= 23).length;
    const lows = 6 - highs;
    
    let consecs = 0;
    for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i] + 1 === numbers[i+1]) consecs++;
    }

    let pts = 0;
    if (sum >= 100 && sum <= 170) pts++; if (odds >= 2 && odds <= 4) pts++; if (highs >= 2 && highs <= 4) pts++; if (consecs <= 1) pts++;
    
    const grade = pts >= 4 ? "최적의 통계적 밸런스" : pts === 3 ? "안정적인 표준 조합" : "도전적인 변칙 패턴";
    const icon = pts >= 4 ? "⚖️" : pts === 3 ? "✅" : "🚀";

    // 결과값 출력 보강
    document.getElementById('pattern-grade').textContent = grade;
    document.getElementById('status-icon').textContent = icon;
    document.getElementById('val-sum').textContent = sum;
    document.getElementById('val-odd-even').textContent = `${odds}:${evens}`;
    document.getElementById('val-high-low').textContent = `${highs}:${lows}`; 
    document.getElementById('val-consecutive').textContent = `${consecs}회`;
    
    // 리포트 설명 갱신 로직 추가
    const descMap = {
        "최적의 통계적 밸런스": "모든 지표가 역대 당첨 데이터의 최빈값 범위에 완벽하게 일치합니다. 가장 안정적인 조합입니다.",
        "안정적인 표준 조합": "대부분의 지표가 통계적 표준 내에 위치합니다. 균형 잡힌 확률적 구성을 보여줍니다.",
        "도전적인 변칙 패턴": "출현 빈도가 다소 낮은 독특한 구성을 포함합니다. 변칙적인 회차를 공략하기에 적합합니다."
    };
    const pDesc = document.getElementById('pattern-desc');
    if (pDesc) pDesc.textContent = descMap[grade];
}

async function calculateRealtimeTrend() {
    const trendRange = document.getElementById('trend-range'), trendNum = document.getElementById('trend-number'), trendOE = document.getElementById('trend-odd-even');
    if (!trendRange) return;
    const baseDate = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - baseDate) / (1000*60*60*24*7));
    let r = 1153 + weeksDiff;
    let recentGames = [];
    while (recentGames.length < 5 && r > 1150) {
        try {
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r}`)}`);
            const data = await res.json();
            if (data && data.returnValue === "success") recentGames.push([data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6]);
        } catch (e) {}
        r--;
        await new Promise(res => setTimeout(res, 100));
    }
    if (recentGames.length > 0) {
        const flatNums = recentGames.flat();
        const rangeStats = { '10번대미만': 0, '10번대': 0, '20번대': 0, '30번대': 0, '40번대': 0 };
        const numFreq = {};
        let totalOdds = 0;
        flatNums.forEach(n => {
            if (n <= 10) rangeStats['10번대미만']++; else if (n <= 20) rangeStats['10번대']++; else if (n <= 30) rangeStats['20번대']++; else if (n <= 40) rangeStats['30번대']++; else rangeStats['40번대']++;
            numFreq[n] = (numFreq[n] || 0) + 1; if (n % 2 !== 0) totalOdds++;
        });
        const hRange = Object.keys(rangeStats).reduce((a, b) => rangeStats[a] > rangeStats[b] ? a : b);
        const hNum = Object.keys(numFreq).reduce((a, b) => numFreq[a] > numFreq[b] ? a : b);
        const avgOdds = Math.round((totalOdds / (recentGames.length * 6)) * 6);
        trendRange.textContent = hRange; trendNum.textContent = `${hNum}번 (${numFreq[hNum]}회)`; trendOE.textContent = `${avgOdds} : ${6-avgOdds}`;
    }
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
    const baseDate = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - baseDate) / (1000*60*60*24*7));
    let round = 1153 + weeksDiff;
    let loadedCount = 0;
    while (loadedCount < 8 && round > 1150) {
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`)}`;
            const response = await fetch(proxyUrl);
            const rawData = await response.json();
            const data = typeof rawData.contents === 'string' ? JSON.parse(rawData.contents) : rawData.contents;
            if (data && data.returnValue === "success") {
                const row = document.createElement('tr');
                const nums = [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6];
                const numsHtml = nums.map(n => `<div class="number ${getBallColorClass(n)}" style="width:32px;height:32px;font-size:0.8rem;border-radius:8px;">${n}</div>`).join('');
                const prize = new Intl.NumberFormat('ko-KR').format(data.firstWinamnt);
                row.innerHTML = `<td><strong>${data.drwNo}</strong></td><td><small>${data.drwNoDate}</small></td><td><div class="numbers-display" style="margin:0;gap:4px;">${numsHtml} <span style="color:#ccc">+</span> <div class="number ${getBallColorClass(data.bnusNo)}" style="width:32px;height:32px;font-size:0.8rem;border-radius:8px;">${data.bnusNo}</div></div></td><td><small>${data.firstPrzwnerCo}명<br>${prize}원</small></td><td><span class="grade-badge grade-opt">최적</span></td>`;
                body.appendChild(row);
                loadedCount++;
            }
        } catch (e) {}
        round--;
        await new Promise(r => setTimeout(r, 200));
    }
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'none';
}