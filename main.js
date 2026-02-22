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
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // Sound setup
    document.querySelectorAll('button, a, .tab-btn').forEach(el => {
        el.addEventListener('click', () => playSound('click'));
    });

    if (document.getElementById('tab-auto')) initLottoTool();
    if (document.getElementById('results-body')) initResultsHistory();
});

// --- Home Logic ---
function initLottoTool() {
    const tabAuto = document.getElementById('tab-auto'), tabManual = document.getElementById('tab-manual');
    const viewAuto = document.getElementById('view-auto'), viewManual = document.getElementById('view-manual');
    const btnGen = document.getElementById('btn-generate-auto'), btnAnlz = document.getElementById('btn-analyze-manual');

    tabAuto.onclick = () => { 
        tabAuto.classList.add('active'); tabManual.classList.remove('active'); 
        viewAuto.style.display='block'; viewManual.style.display='none'; 
    };
    tabManual.onclick = () => { 
        tabManual.classList.add('active'); tabAuto.classList.remove('active'); 
        viewManual.style.display='block'; viewAuto.style.display='none'; 
    };

    btnGen.onclick = async () => {
        btnGen.disabled = true;
        const display = document.getElementById('auto-numbers-display');
        display.innerHTML = '';
        const nums = Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b);
        
        nums.forEach(n => {
            const ball = document.createElement('div');
            ball.className = `number ${getBallColor(n)}`;
            ball.textContent = n;
            display.appendChild(ball);
        });
        btnGen.disabled = false;
        showAnalysis(nums);
    };

    btnAnlz.onclick = () => {
        const inputs = document.querySelectorAll('.manual-inputs input');
        const nums = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (nums.length < 6) return alert('6개의 번호를 입력하세요.');
        showAnalysis(nums.sort((a,b)=>a-b));
    };
}

// --- History Logic ---
async function initResultsHistory() {
    const body = document.getElementById('results-body');
    const spinner = document.getElementById('loading-spinner');
    
    // Estimate latest round (Today is 2026-02-22)
    const baseDate = new Date(2025, 0, 4);
    const weeks = Math.floor((new Date() - baseDate) / (1000*60*60*24*7));
    let round = 1153 + weeks;

    let loaded = 0;
    while (loaded < 10 && round > 1150) {
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`)}`);
            const json = await res.json();
            const data = JSON.parse(json.contents);
            if (data.returnValue === "success") {
                appendRow(data);
                loaded++;
            }
        } catch (e) {}
        round--;
    }
    spinner.style.display = 'none';
}

function appendRow(d) {
    const body = document.getElementById('results-body');
    const row = document.createElement('tr');
    const nums = [d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6];
    const numsHtml = nums.map(n => `<div class="number ${getBallColor(n)}" style="width:35px;height:35px;font-size:0.9rem;">${n}</div>`).join('');
    const prize = new Intl.NumberFormat('ko-KR').format(d.firstWinamnt);
    
    row.innerHTML = `
        <td>${d.drwNo}회</td>
        <td>${d.drwNoDate}</td>
        <td><div class="numbers-display" style="margin:0;gap:5px;">${numsHtml}</div></td>
        <td>${d.firstPrzwnerCo}명 / ${prize}원</td>
        <td><span class="grade-badge grade-opt">최적</span></td>
    `;
    body.appendChild(row);
}

function getBallColor(n) {
    if (n <= 10) return 'num-1-10'; if (n <= 20) return 'num-11-20';
    if (n <= 30) return 'num-21-30'; if (n <= 40) return 'num-31-40';
    return 'num-41-45';
}

function showAnalysis(nums) {
    const rep = document.getElementById('analysis-report');
    rep.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = nums.join(', ');
    rep.scrollIntoView({ behavior: 'smooth' });
}