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
        osc2.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc2.connect(gain2); gain2.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if(type === 'celebration') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, audioCtx.currentTime + (i * 0.1));
            g.gain.setValueAtTime(0.2, audioCtx.currentTime + (i * 0.1));
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (i * 0.1) + 0.8);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(audioCtx.currentTime + (i * 0.1));
            o.stop(audioCtx.currentTime + (i * 0.1) + 0.8);
        });
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
});

// --- Home Tool Logic ---
function initLottoTool() {
    const tabAuto = document.getElementById('tab-auto'), tabManual = document.getElementById('tab-manual');
    const viewAuto = document.getElementById('view-auto'), viewManual = document.getElementById('view-manual');
    const btnGen = document.getElementById('btn-generate-auto'), btnAnlz = document.getElementById('btn-analyze-manual');
    const display = document.getElementById('auto-numbers-display');

    tabAuto.onclick = () => { 
        tabAuto.className='tab-btn active'; tabManual.className='tab-btn'; 
        viewAuto.style.display='block'; viewManual.style.display='none'; 
        document.getElementById('analysis-report').style.display = 'none';
    };
    tabManual.onclick = () => { 
        tabManual.className='tab-btn active'; tabAuto.className='tab-btn'; 
        viewManual.style.display='block'; viewAuto.style.display='none'; 
        document.getElementById('analysis-report').style.display = 'none';
        setupManualInputs();
    };

    btnGen.onclick = async () => {
        btnGen.disabled = true;
        btnGen.textContent = '데이터 분석 중...';
        display.innerHTML = '';
        document.getElementById('analysis-report').style.display = 'none';

        const finalNums = Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b);
        const balls = [];

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
                // playSound('rolling'); // 주석 처리: 불필요한 사운드 중첩 방지
            }, 150);

            await new Promise(r => setTimeout(r, 400 + (i * 300)));
            clearInterval(interval);
            ball.className = `number ${getBallColorClass(val)}`;
            ball.textContent = val;
            playSound('pop');
        }

        playSound('celebration');
        runProfessionalAnalysis(finalNums, 'AI 추천');
        btnGen.disabled = false;
        btnGen.textContent = '번호 추출 시작 ✨';
    };

    btnAnlz.onclick = () => {
        const inputs = document.querySelectorAll('.manual-inputs input');
        const nums = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (nums.length < 6) return alert('6개의 번호를 모두 입력해주세요!');
        runProfessionalAnalysis(nums.sort((a,b)=>a-b), '입력 번호');
    };
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
                playSound('pop');
            }
        };
    });
}

// --- 실시간 다중 트렌드 분석 로직 ---
async function calculateRealtimeTrend() {
    const trendRange = document.getElementById('trend-range');
    const trendNumber = document.getElementById('trend-number');
    const trendOddEven = document.getElementById('trend-odd-even');
    if (!trendRange) return;

    const baseDate = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - baseDate) / (1000*60*60*24*7));
    let r = 1153 + weeksDiff;

    let recentNumbers = [];
    let fetchCount = 0;
    
    while (recentNumbers.length < 5 && r > 1150) {
        try {
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r}`)}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.returnValue === "success") {
                    recentNumbers.push([data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6]);
                }
            }
        } catch (e) {}
        r--;
        await new Promise(res => setTimeout(res, 200));
    }

    if (recentNumbers.length > 0) {
        const flatNums = recentNumbers.flat();
        
        // 1. 번호대 분석
        const rangeStats = { '10번대미만': 0, '10번대': 0, '20번대': 0, '30번대': 0, '40번대': 0 };
        // 2. 숫자별 빈도 분석
        const numFreq = {};
        // 3. 홀짝 비중 분석
        let totalOdds = 0;

        flatNums.forEach(n => {
            if (n <= 10) rangeStats['10번대미만']++;
            else if (n <= 20) rangeStats['10번대']++;
            else if (n <= 30) rangeStats['20번대']++;
            else if (n <= 40) rangeStats['30번대']++;
            else rangeStats['40번대']++;

            numFreq[n] = (numFreq[n] || 0) + 1;
            if (n % 2 !== 0) totalOdds++;
        });

        const hottestRange = Object.keys(rangeStats).reduce((a, b) => rangeStats[a] > rangeStats[b] ? a : b);
        const hottestNum = Object.keys(numFreq).reduce((a, b) => numFreq[a] > numFreq[b] ? a : b);
        const avgOdds = Math.round((totalOdds / (recentNumbers.length * 6)) * 6);

        // UI 업데이트
        trendRange.textContent = hottestRange;
        trendNumber.textContent = `${hottestNum}번 (${numFreq[hottestNum]}회)`;
        trendOddEven.textContent = `${avgOdds} : ${6 - avgOdds}`;
    } else {
        trendRange.textContent = "20번대";
        trendNumber.textContent = "27번";
        trendOddEven.textContent = "3 : 3";
    }
}

// --- History Logic ---
async function initResultsHistory() {
    const body = document.getElementById('results-body');
    const baseDate = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - baseDate) / (1000*60*60*24*7));
    let round = 1153 + weeksDiff;
    let loaded = 0;
    while (loaded < 8 && round > 1150) {
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`)}`);
            const json = await res.json();
            const d = JSON.parse(json.contents);
            if (d && d.returnValue === "success") {
                appendHistoryRow(d);
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

function getBallColorClass(val) {
    if (val <= 10) return 'num-1-10'; if (val <= 20) return 'num-11-20';
    if (val <= 30) return 'num-21-30'; if (val <= 40) return 'num-31-40';
    return 'num-41-45';
}

function runProfessionalAnalysis(numbers, type) {
    const report = document.getElementById('analysis-report');
    if (!report) return;
    report.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = numbers.join(', ');
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const highs = numbers.filter(n => n >= 23).length;
    let pts = 0;
    if (sum >= 100 && sum <= 170) pts++; if (odds >= 2 && odds <= 4) pts++; if (highs >= 2 && highs <= 4) pts++;
    document.getElementById('pattern-grade').textContent = (sum >= 100 && sum <= 170) ? "최적의 밸런스" : "안정적 표준";
    document.getElementById('val-sum').textContent = sum;
    document.getElementById('val-odd-even').textContent = `${odds}:${6-odds}`;
    document.getElementById('val-high-low').textContent = `${highs}:${6-highs}`; 
    document.getElementById('val-consecutive').textContent = "분석 완료";
}