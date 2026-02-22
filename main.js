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

    // Tab Switching
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

    // Auto Generation
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
                playSound('rolling');
            }, 80);
            await new Promise(r => setTimeout(r, 600 + (i * 200)));
            clearInterval(interval);
            ball.className = `number ${getBallColorClass(val)}`;
            ball.textContent = val;
            playSound('pop');
        }

        runProfessionalAnalysis(finalNums, 'AI 추천');
        btnGen.disabled = false;
        btnGen.textContent = '번호 추출 시작 ✨';
    };

    // Manual Analysis
    btnAnlz.onclick = () => {
        const inputs = document.querySelectorAll('.manual-inputs input');
        const nums = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (nums.length < 6) return alert('6개의 번호를 모두 입력해주세요!');
        if (new Set(nums).size !== 6) return alert('중복된 번호가 있습니다!');
        runProfessionalAnalysis(nums.sort((a,b)=>a-b), '입력 번호');
    };
}

// Setup Manual Input Interactions
function setupManualInputs() {
    const inputs = document.querySelectorAll('.manual-inputs input');
    inputs.forEach(input => {
        input.className = 'manual-input'; // Ensure style class is applied
        input.oninput = () => {
            const val = parseInt(input.value);
            // Remove old color classes
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

// --- History Logic ---
async function initResultsHistory() {
    const body = document.getElementById('results-body');
    const start = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((new Date() - start) / (1000*60*60*24*7));
    let round = 1153 + weeksDiff;

    let loadedCount = 0;
    while (loadedCount < 8 && round > 1150) {
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`)}`;
            const response = await fetch(proxyUrl);
            const rawData = await response.json();
            const data = typeof rawData.contents === 'string' ? JSON.parse(rawData.contents) : rawData.contents;
            if (data && data.returnValue === "success") {
                appendHistoryRow(data);
                loadedCount++;
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
    row.innerHTML = `
        <td><strong>${d.drwNo}</strong></td>
        <td><small>${d.drwNoDate}</small></td>
        <td><div class="numbers-display" style="margin:0;gap:4px;">${numsHtml} <span style="color:#ccc">+</span> <div class="number ${getBallColorClass(d.bnusNo)}" style="width:32px;height:32px;font-size:0.8rem;border-radius:8px;">${d.bnusNo}</div></div></td>
        <td><small>${d.firstPrzwnerCo}명<br>${prize}원</small></td>
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
    document.getElementById('current-analyzed-numbers').textContent = numbers.join(', ');
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const highs = numbers.filter(n => n >= 23).length;
    document.getElementById('pattern-grade').textContent = (sum >= 100 && sum <= 170) ? "최적의 밸런스" : "안정적 표준";
    document.getElementById('val-sum').textContent = sum;
    document.getElementById('val-odd-even').textContent = `${odds}:${6-odds}`;
    document.getElementById('val-high-low').textContent = `${highs}:${6-highs}`; 
    document.getElementById('val-consecutive').textContent = "분석 완료";
    report.scrollIntoView({ behavior: 'smooth' });
}