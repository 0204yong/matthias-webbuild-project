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
    // Theme
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // Common Click Sound
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

    tabAuto.onclick = () => { tabAuto.className='tab-btn active'; tabManual.className='tab-btn'; viewAuto.style.display='block'; viewManual.style.display='none'; };
    tabManual.onclick = () => { tabManual.className='tab-btn active'; tabAuto.className='tab-btn'; viewManual.style.display='block'; viewAuto.style.display='none'; };

    btnGen.onclick = async () => {
        btnGen.disabled = true;
        const display = document.getElementById('auto-numbers-display');
        display.innerHTML = '';
        const nums = Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b);
        
        for (let n of nums) {
            const ball = document.createElement('div');
            ball.className = `number ${getBallColor(n)}`;
            ball.textContent = n;
            display.appendChild(ball);
            playSound('pop');
            await new Promise(r => setTimeout(r, 100));
        }
        btnGen.disabled = false;
        runAnalysis(nums, '추천 번호');
    };

    btnAnlz.onclick = () => {
        const inputs = document.querySelectorAll('.manual-inputs input');
        const nums = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (nums.length < 6) return alert('6개 번호를 입력하세요!');
        runAnalysis(nums.sort((a,b)=>a-b), '입력 번호');
    };
}

// --- Results History Logic ---
async function initResultsHistory() {
    const body = document.getElementById('results-body');
    const spinner = document.getElementById('loading-spinner');
    
    // Estimate latest round
    const start = new Date(2025, 0, 4);
    const weeks = Math.floor((new Date() - start) / (1000*60*60*24*7));
    let round = 1153 + weeks;

    spinner.innerHTML = "데이터를 동기화 중입니다... 잠시만 기다려주세요. 🔄";

    let loaded = 0;
    while (loaded < 10 && round > 1150) {
        try {
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`)}`);
            const data = await res.json();
            if (data.returnValue === "success") {
                appendHistoryRow(data);
                loaded++;
            }
        } catch (e) {}
        round--;
    }
    spinner.style.display = 'none';
}

function appendHistoryRow(d) {
    const body = document.getElementById('results-body');
    const row = document.createElement('tr');
    const nums = [d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6];
    const numsHtml = nums.map(n => `<div class="number ${getBallColor(n)}" style="width:30px;height:30px;font-size:0.8rem;">${n}</div>`).join('');
    const prize = new Intl.NumberFormat('ko-KR').format(d.firstWinamnt);
    
    row.innerHTML = `
        <td>${d.drwNo}회</td>
        <td><small>${d.drwNoDate}</small></td>
        <td><div class="numbers-display" style="margin:0;gap:5px;">${numsHtml} <span style="color:#ccc">+</span> <div class="number ${getBallColor(d.bnusNo)}" style="width:30px;height:30px;font-size:0.8rem;">${d.bnusNo}</div></div></td>
        <td><small>${d.firstPrzwnerCo}명 / ${prize}원</small></td>
        <td><span class="grade-badge grade-opt">최적</span></td>
    `;
    body.appendChild(row);
}

function getBallColor(n) {
    if (n <= 10) return 'num-1-10'; if (n <= 20) return 'num-11-20';
    if (n <= 30) return 'num-21-30'; if (n <= 40) return 'num-31-40';
    return 'num-41-45';
}

function runAnalysis(nums, type) {
    const rep = document.getElementById('analysis-report');
    rep.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = `${type}: ${nums.join(', ')}`;
    const sum = nums.reduce((a,b)=>a+b, 0);
    document.getElementById('val-sum').textContent = sum;
    document.getElementById('pattern-grade').textContent = (sum >= 100 && sum <= 170) ? "최적의 밸런스" : "안정적 조합";
    rep.scrollIntoView({ behavior: 'smooth' });
}