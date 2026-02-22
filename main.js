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
    // Theme
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // Sound for all buttons/links
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

    tabAuto.onclick = () => { 
        tabAuto.className='tab-btn active'; tabManual.className='tab-btn'; 
        viewAuto.style.display='block'; viewManual.style.display='none'; 
        document.getElementById('analysis-report').style.display = 'none';
    };
    tabManual.onclick = () => { 
        tabManual.className='tab-btn active'; tabAuto.className='tab-btn'; 
        viewManual.style.display='block'; viewAuto.style.display='none'; 
        document.getElementById('analysis-report').style.display = 'none';
    };

    btnGen.onclick = async () => {
        btnGen.disabled = true;
        display.innerHTML = '';
        document.getElementById('analysis-report').style.display = 'none';

        const finalNums = Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b);
        const balls = [];

        // 1. Create Spinning Balls
        for (let i = 0; i < 6; i++) {
            const ball = document.createElement('div');
            ball.className = 'number spinning';
            ball.textContent = '?';
            display.appendChild(ball);
            balls.push(ball);
        }

        // 2. Sequential Stop Animation (Slot Machine Effect)
        for (let i = 0; i < 6; i++) {
            const ball = balls[i];
            const val = finalNums[i];
            
            const interval = setInterval(() => {
                ball.textContent = Math.floor(Math.random()*45)+1;
                playSound('rolling');
            }, 80);

            await new Promise(r => setTimeout(r, 500 + (i * 200)));
            clearInterval(interval);
            
            ball.className = `number ${getBallColorClass(val)}`;
            ball.textContent = val;
            playSound('pop');
        }

        runProfessionalAnalysis(finalNums, '추천 번호');
        btnGen.disabled = false;
    };

    btnAnlz.onclick = () => {
        const inputs = document.querySelectorAll('.manual-inputs input');
        const nums = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (nums.length < 6) return alert('6개의 번호를 모두 입력해주세요!');
        if (new Set(nums).size !== 6) return alert('중복된 번호가 있습니다!');
        runProfessionalAnalysis(nums.sort((a,b)=>a-b), '입력 번호');
    };
}

// --- History Logic ---
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
            const target = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(target)}`);
            const data = await res.json();
            
            if (data && data.returnValue === "success") {
                appendHistoryRow(data);
                loadedCount++;
            }
        } catch (e) { console.error('Round failed:', round, e); }
        round--;
        // Small delay to prevent API flooding
        await new Promise(r => setTimeout(r, 100));
    }
    loadingSpinner.style.display = 'none';
}

function appendHistoryRow(d) {
    const body = document.getElementById('results-body');
    const row = document.createElement('tr');
    const nums = [d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6];
    const numsHtml = nums.map(n => `<div class="number ${getBallColorClass(n)}" style="width:35px;height:35px;font-size:0.8rem;">${n}</div>`).join('');
    const prize = new Intl.NumberFormat('ko-KR').format(d.firstWinamnt);
    
    row.innerHTML = `
        <td><strong>${d.drwNo}회</strong></td>
        <td><small>${d.drwNoDate}</small></td>
        <td><div class="numbers-display" style="margin:0;gap:5px;">${numsHtml} <span style="color:#ccc">+</span> <div class="number ${getBallColorClass(d.bnusNo)}" style="width:35px;height:35px;font-size:0.8rem;">${d.bnusNo}</div></div></td>
        <td>${d.firstPrzwnerCo}명 / ${prize}원</td>
        <td><span class="grade-badge grade-opt">최적</span></td>
    `;
    body.appendChild(row);
}

function getBallColorClass(val) {
    if (val <= 10) return 'num-1-10'; if (val <= 20) return 'num-11-20';
    if (val <= 30) return 'num-21-30'; if (val <= 40) return 'num-31-40';
    return 'num-41-45';
}

// --- Professional Analysis Engine ---
function runProfessionalAnalysis(numbers, type) {
    const report = document.getElementById('analysis-report');
    report.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = `${type}: ${numbers.join(', ')}`;
    
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const highs = numbers.filter(n => n >= 23).length;
    let consecs = 0;
    for (let i = 0; i < numbers.length - 1; i++) if (numbers[i] + 1 === numbers[i+1]) consecs++;

    let stabilityPoints = 0;
    if (sum >= 100 && sum <= 170) stabilityPoints++;
    if (odds >= 2 && odds <= 4) stabilityPoints++;
    if (highs >= 2 && highs <= 4) stabilityPoints++;
    if (consecs <= 1) stabilityPoints++;

    let grade, desc, icon;
    if (stabilityPoints === 4) { grade = "최적의 통계적 밸런스"; desc = "역대 당첨 데이터와 가장 유사한 안정적인 조합입니다."; icon = "⚖️"; }
    else if (stabilityPoints === 3) { grade = "안정적인 표준 조합"; desc = "균형 잡힌 확률적 구성을 보여주는 표준적인 조합입니다."; icon = "✅"; }
    else { grade = "도전적인 변칙 패턴"; desc = "일부 지표가 희귀 패턴을 포함하고 있는 실험적 구성입니다."; icon = "🚀"; }

    document.getElementById('pattern-grade').textContent = grade;
    document.getElementById('pattern-desc').textContent = desc;
    document.getElementById('status-icon').textContent = icon;
    document.getElementById('val-sum').textContent = sum;
    document.getElementById('val-odd-even').textContent = `${odds}:${6-odds}`;
    document.getElementById('val-high-low').textContent = `${highs}:${6-highs}`; 
    document.getElementById('val-consecutive').textContent = `${consecs}회`;
}