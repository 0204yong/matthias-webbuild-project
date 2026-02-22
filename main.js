// --- Sound Engine ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    switch(type) {
        case 'menuHover': osc.type = 'square'; osc.frequency.setValueAtTime(1200, audioCtx.currentTime); gain.gain.setValueAtTime(0.02, audioCtx.currentTime); break;
        case 'click': osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.06); gain.gain.setValueAtTime(0.06, audioCtx.currentTime); break;
        case 'rolling': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, audioCtx.currentTime); gain.gain.setValueAtTime(0.01, audioCtx.currentTime); break;
        case 'pop': osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.04); gain.gain.setValueAtTime(0.04, audioCtx.currentTime); break;
    }
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.06);
}

// --- DOM Elements ---
const btnAuto = document.getElementById('btn-auto');
const btnToggleManual = document.getElementById('btn-toggle-manual');
const btnAnalyze = document.getElementById('btn-analyze');
const display = document.getElementById('numbers-display');
const manualArea = document.getElementById('manual-area');
const reportSection = document.getElementById('analysis-report');
const overallScore = document.getElementById('overall-score');
const scoreComment = document.getElementById('score-comment');
const reportDetails = document.getElementById('report-details');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('button, a, input').forEach(el => {
        el.addEventListener('mouseenter', () => playSound('menuHover'));
    });
});

// --- Logic ---
btnToggleManual.addEventListener('click', () => {
    playSound('click');
    manualArea.style.display = manualArea.style.display === 'none' ? 'block' : 'none';
    if (manualArea.style.display === 'block') manualArea.scrollIntoView({ behavior: 'smooth' });
});

btnAuto.addEventListener('click', async () => {
    playSound('click');
    btnAuto.disabled = true;
    btnAuto.textContent = '추출 중... 🎰';
    display.innerHTML = '';
    
    const finalNumbers = Array.from({length: 45}, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .sort((a,b)=>a-b);
        
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
        const val = finalNumbers[i];
        const duration = 500 + (i * 200);
        
        const interval = setInterval(() => {
            ball.textContent = Math.floor(Math.random()*45)+1;
            playSound('rolling');
        }, 80);

        await new Promise(r => setTimeout(r, duration));
        clearInterval(interval);
        
        ball.className = `number ${getBallColorClass(val)}`;
        ball.textContent = val;
        playSound('pop');
    }

    runAnalysis(finalNumbers);
    btnAuto.disabled = false;
    btnAuto.textContent = '자동 번호 생성 ✨';
});

btnAnalyze.addEventListener('click', () => {
    playSound('click');
    const inputs = document.querySelectorAll('.manual-inputs input');
    const numbers = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
    
    if (numbers.length < 6) { alert('6개의 번호를 모두 입력해주세요!'); return; }
    if (new Set(numbers).size !== 6) { alert('중복된 번호가 있습니다!'); return; }
    if (numbers.some(n => n < 1 || n > 45)) { alert('1~45 사이의 숫자만 입력 가능합니다!'); return; }

    runAnalysis(numbers.sort((a,b)=>a-b));
});

function getBallColorClass(val) {
    if (val <= 10) return 'num-1-10';
    if (val <= 20) return 'num-11-20';
    if (val <= 30) return 'num-21-30';
    if (val <= 40) return 'num-31-40';
    return 'num-41-45';
}

function runAnalysis(numbers) {
    reportSection.style.display = 'block';
    
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const highs = numbers.filter(n => n >= 23).length;
    let consecs = 0;
    for (let i = 0; i < numbers.length - 1; i++) if (numbers[i] + 1 === numbers[i+1]) consecs++;

    let score = 0;
    if (sum >= 100 && sum <= 170) score += 40; else if (sum >= 80 && sum <= 200) score += 20;
    if (odds >= 2 && odds <= 4) score += 30;
    if (highs >= 2 && highs <= 4) score += 20;
    if (consecs <= 1) score += 10;

    animateScore(score);
    
    reportDetails.innerHTML = `
        <div class="detail-item"><span>번호 총합</span><strong>${sum}</strong></div>
        <div class="detail-item"><span>홀짝 비율</span><strong>${odds}:${6-odds}</strong></div>
        <div class="detail-item"><span>고저 비율</span><strong>${6-highs}:${highs}</strong></div>
        <div class="detail-item"><span>연속 번호</span><strong>${consecs}회</strong></div>
    `;
    
    scoreComment.textContent = score >= 80 ? "🚀 10년 데이터상 강력한 당첨 패턴입니다!" : "⚖️ 균형 잡힌 데이터 분포입니다.";
    reportSection.scrollIntoView({ behavior: 'smooth' });
}

function animateScore(target) {
    let current = 0;
    const interval = setInterval(() => {
        if (current >= target) { clearInterval(interval); overallScore.textContent = target; }
        else { current++; overallScore.textContent = current; }
    }, 20);
}

// Theme
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});