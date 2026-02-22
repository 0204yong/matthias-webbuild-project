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
const tabAuto = document.getElementById('tab-auto');
const tabManual = document.getElementById('tab-manual');
const viewAuto = document.getElementById('view-auto');
const viewManual = document.getElementById('view-manual');

const btnGenerateAuto = document.getElementById('btn-generate-auto');
const btnAnalyzeManual = document.getElementById('btn-analyze-manual');
const autoDisplay = document.getElementById('auto-numbers-display');
const reportSection = document.getElementById('analysis-report');
const currentAnalyzedTag = document.getElementById('current-analyzed-numbers');

// Report Details
const patternGrade = document.getElementById('pattern-grade');
const patternDesc = document.getElementById('pattern-desc');
const statusIcon = document.getElementById('status-icon');
const valSum = document.getElementById('val-sum');
const valOddEven = document.getElementById('val-odd-even');
const valHighLow = document.getElementById('val-high-low');
const valConsecutive = document.getElementById('val-consecutive');

// --- Tab Switching ---
tabAuto.addEventListener('click', () => {
    playSound('click');
    tabAuto.classList.add('active');
    tabManual.classList.remove('active');
    viewAuto.style.display = 'block';
    viewManual.style.display = 'none';
    reportSection.style.display = 'none'; // Hide report when switching
});

tabManual.addEventListener('click', () => {
    playSound('click');
    tabManual.classList.add('active');
    tabAuto.classList.remove('active');
    viewManual.style.display = 'block';
    viewAuto.style.display = 'none';
    reportSection.style.display = 'none'; // Hide report when switching
});

// --- Auto Recommendation Logic ---
btnGenerateAuto.addEventListener('click', async () => {
    playSound('click');
    btnGenerateAuto.disabled = true;
    btnGenerateAuto.textContent = '조합 추출 중... 🎰';
    autoDisplay.innerHTML = '';
    reportSection.style.display = 'none';

    const numbers = Array.from({length: 45}, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .sort((a,b)=>a-b);
        
    const balls = [];
    for (let i = 0; i < 6; i++) {
        const ball = document.createElement('div');
        ball.className = 'number spinning';
        ball.textContent = '?';
        autoDisplay.appendChild(ball);
        balls.push(ball);
    }

    for (let i = 0; i < 6; i++) {
        const ball = balls[i];
        const val = numbers[i];
        const duration = 400 + (i * 200);
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

    runProfessionalAnalysis(numbers, '추천 번호');
    btnGenerateAuto.disabled = false;
    btnGenerateAuto.textContent = '번호 추출 시작 ✨';
});

// --- Manual Analysis Logic ---
btnAnalyzeManual.addEventListener('click', () => {
    playSound('click');
    const inputs = document.querySelectorAll('.manual-inputs input');
    const numbers = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
    
    if (numbers.length < 6) { alert('6개의 번호를 모두 입력해주세요!'); return; }
    if (new Set(numbers).size !== 6) { alert('중복된 번호가 있습니다!'); return; }
    if (numbers.some(n => n < 1 || n > 45)) { alert('1~45 사이의 숫자만 입력 가능합니다!'); return; }

    runProfessionalAnalysis(numbers.sort((a,b)=>a-b), '입력 번호');
});

function getBallColorClass(val) {
    if (val <= 10) return 'num-1-10';
    if (val <= 20) return 'num-11-20';
    if (val <= 30) return 'num-21-30';
    if (val <= 40) return 'num-31-40';
    return 'num-41-45';
}

function runProfessionalAnalysis(numbers, type) {
    reportSection.style.display = 'block';
    currentAnalyzedTag.textContent = `${type}: ${numbers.join(', ')}`;
    
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const evens = 6 - odds;
    const highs = numbers.filter(n => n >= 23).length;
    const lows = 6 - highs;
    let consecs = 0;
    for (let i = 0; i < numbers.length - 1; i++) if (numbers[i] + 1 === numbers[i+1]) consecs++;

    let stabilityPoints = 0;
    if (sum >= 100 && sum <= 170) stabilityPoints++;
    if (odds >= 2 && odds <= 4) stabilityPoints++;
    if (highs >= 2 && highs <= 4) stabilityPoints++;
    if (consecs <= 1) stabilityPoints++;

    let grade, desc, icon;
    if (stabilityPoints === 4) {
        grade = "최적의 통계적 밸런스";
        desc = "모든 통계 지표가 역대 당첨 데이터의 최빈값 범위에 속하는 매우 안정적인 조합입니다.";
        icon = "⚖️";
    } else if (stabilityPoints === 3) {
        grade = "안정적인 표준 조합";
        desc = "대부분의 지표가 표준 분포 내에 있으며, 균형 잡힌 확률적 구성을 보여줍니다.";
        icon = "✅";
    } else if (stabilityPoints === 2) {
        grade = "도전적인 실험적 패턴";
        desc = "일부 지표가 희귀 패턴을 포함하고 있습니다. 평범하지 않은 당첨 회차를 기대하는 조합입니다.";
        icon = "🚀";
    } else {
        grade = "희귀한 변칙적 패턴";
        desc = "통계적으로 출현 빈도가 낮은 극단적인 구성입니다. 매우 드문 케이스의 당첨 패턴에 해당합니다.";
        icon = "🌋";
    }

    patternGrade.textContent = grade;
    patternDesc.textContent = desc;
    statusIcon.textContent = icon;
    valSum.textContent = sum;
    valOddEven.textContent = `${odds}:${evens}`;
    valHighLow.textContent = `${highs}:${lows}`;
    valConsecutive.textContent = `${consecs}회`;
    
    reportSection.scrollIntoView({ behavior: 'smooth' });
}

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// Hover Sounds
document.querySelectorAll('button, a, input').forEach(el => {
    el.addEventListener('mouseenter', () => playSound('menuHover'));
});