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

// --- Configuration ---
const GAMES = {
    lotto: {
        title: "Lucky Lotto 6/45 🍀", desc: "1부터 45까지, 당신의 행운을 결정할 6개의 숫자", 
        generate: () => Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b),
        inputs: 6, placeholders: ["1", "2", "3", "4", "5", "6"]
    },
    pension: {
        title: "Pension 720+ 🏠", desc: "1~5조 중 1개 + 0~9 사이의 6자리 숫자 조합", 
        generate: () => [Math.floor(Math.random()*5)+1, ...Array.from({length: 6}, () => Math.floor(Math.random()*10))],
        inputs: 7, placeholders: ["조", "10만", "만", "천", "백", "십", "일"]
    },
    powerball: {
        title: "Powerball 🎰", desc: "일반볼 5개(1~28) + 파워볼 1개(0~9)", 
        generate: () => {
            const general = Array.from({length: 28}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 5).sort((a,b)=>a-b);
            return [...general, Math.floor(Math.random()*10)];
        },
        inputs: 6, placeholders: ["1", "2", "3", "4", "5", "P"]
    }
};

let currentGame = 'lotto';

// --- UI Elements ---
const gameBtns = document.querySelectorAll('.game-btn');
const numbersContainer = document.getElementById('numbers-container');
const generateButton = document.getElementById('generate-button');
const gameTitle = document.getElementById('game-title');
const gameDesc = document.getElementById('game-desc');
const autoModeBtn = document.getElementById('auto-mode-btn');
const manualModeBtn = document.getElementById('manual-mode-btn');
const autoView = document.getElementById('auto-view');
const manualView = document.getElementById('manual-view');
const manualInputsContainer = document.getElementById('manual-inputs-container');
const manualAnalyzeButton = document.getElementById('manual-analyze-button');

// Report UI
const overallScore = document.getElementById('overall-score');
const scoreComment = document.getElementById('score-comment');
const statSum = document.getElementById('stat-sum');
const statOddEven = document.getElementById('stat-odd-even');
const statHighLow = document.getElementById('stat-high-low');
const statConsecutive = document.getElementById('stat-consecutive');
const matchBar = document.getElementById('match-bar');
const matchPercentage = document.getElementById('match-percentage');

// --- Initialization ---
function init() {
    gameBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            gameBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGame = btn.dataset.game;
            updateGameUI();
        });
    });

    autoModeBtn.addEventListener('click', () => {
        playSound('click');
        autoModeBtn.classList.add('active');
        manualModeBtn.classList.remove('active');
        autoView.style.display = 'block';
        manualView.style.display = 'none';
    });

    manualModeBtn.addEventListener('click', () => {
        playSound('click');
        manualModeBtn.classList.add('active');
        autoModeBtn.classList.remove('active');
        manualView.style.display = 'block';
        autoView.style.display = 'none';
        generateManualInputs();
    });

    manualAnalyzeButton.addEventListener('click', analyzeManualNumbers);
    updateGameUI();
}

function updateGameUI() {
    const config = GAMES[currentGame];
    gameTitle.textContent = config.title;
    gameDesc.textContent = config.desc;
    numbersContainer.innerHTML = '';
    resetReport();
    if (manualView.style.display === 'block') generateManualInputs();
}

function generateManualInputs() {
    const config = GAMES[currentGame];
    manualInputsContainer.innerHTML = '';
    for (let i = 0; i < config.inputs; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'manual-input';
        input.placeholder = config.placeholders[i];
        input.min = (currentGame === 'lotto') ? 1 : 0;
        input.max = (currentGame === 'lotto') ? 45 : (currentGame === 'powerball' && i < 5 ? 28 : 9);
        manualInputsContainer.appendChild(input);
        input.addEventListener('mouseenter', () => playSound('menuHover'));
    }
}

function resetReport() {
    overallScore.textContent = '0';
    scoreComment.textContent = '번호를 생성하여 분석을 시작하세요.';
    statSum.textContent = '-'; statOddEven.textContent = '-';
    statHighLow.textContent = '-'; statConsecutive.textContent = '-';
    matchBar.style.width = '0%';
    matchPercentage.textContent = '0% Match';
}

// --- Generation ---
generateButton.addEventListener('click', async () => {
    playSound('click');
    generateButton.disabled = true;
    generateButton.textContent = '통계 엔진 분석 중... 🎰';
    numbersContainer.innerHTML = '';

    const config = GAMES[currentGame];
    const finalNumbers = config.generate();
    const ballElements = [];

    for (let i = 0; i < finalNumbers.length; i++) {
        const ball = document.createElement('div');
        ball.classList.add('number', 'spinning');
        ball.textContent = '?';
        numbersContainer.appendChild(ball);
        ballElements.push(ball);
    }

    for (let i = 0; i < finalNumbers.length; i++) {
        const ball = ballElements[i];
        const finalVal = finalNumbers[i];
        const duration = 400 + (i * 150);
        
        const interval = setInterval(() => {
            if(currentGame === 'lotto') ball.textContent = Math.floor(Math.random()*45)+1;
            else if(currentGame === 'powerball' && i === 5) ball.textContent = Math.floor(Math.random()*10);
            else if(currentGame === 'powerball') ball.textContent = Math.floor(Math.random()*28)+1;
            else ball.textContent = Math.floor(Math.random()*10);
            playSound('rolling');
        }, 80);

        await new Promise(resolve => setTimeout(resolve, duration));
        clearInterval(interval);
        
        ball.classList.remove('spinning');
        ball.textContent = (currentGame === 'pension' && i === 0) ? finalVal + '조' : finalVal;
        applyBallStyles(ball, finalVal, i);
        playSound('pop');
    }

    runStatisticalAnalysis(finalNumbers);
    generateButton.disabled = false;
    generateButton.textContent = '번호 다시 생성하기 ✨';
});

function applyBallStyles(ball, val, index) {
    if(currentGame === 'lotto') {
        if (val <= 10) ball.classList.add('num-1-10');
        else if (val <= 20) ball.classList.add('num-11-20');
        else if (val <= 30) ball.classList.add('num-21-30');
        else if (val <= 40) ball.classList.add('num-31-40');
        else ball.classList.add('num-41-45');
    } else if(currentGame === 'pension') {
        if(index === 0) { ball.style.background = 'linear-gradient(135deg, #2c3e50, #000000)'; ball.style.borderRadius = '8px'; }
        else { ball.style.background = 'linear-gradient(135deg, #ecf0f1, #bdc3c7)'; ball.style.color = '#2d3436'; ball.style.borderRadius = '4px'; }
    } else if(currentGame === 'powerball') {
        if(index === 5) ball.classList.add('num-powerball');
        else ball.classList.add('num-11-20');
    }
}

function analyzeManualNumbers() {
    const inputs = document.querySelectorAll('.manual-input');
    const numbers = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
    const config = GAMES[currentGame];
    
    if (numbers.length < config.inputs) {
        alert('모든 번호를 입력해주세요!');
        return;
    }
    
    playSound('click');
    runStatisticalAnalysis(numbers);
    document.getElementById('analysis').scrollIntoView({ behavior: 'smooth' });
}

// --- Statistical Engine ---
function runStatisticalAnalysis(numbers) {
    let score = 0; let sum = 0; let odds = 0; let highs = 0; let consecs = 0; let matchRate = 0;

    if (currentGame === 'lotto') {
        sum = numbers.reduce((a, b) => a + b, 0);
        odds = numbers.filter(n => n % 2 !== 0).length;
        highs = numbers.filter(n => n >= 23).length;
        for (let i = 0; i < numbers.length - 1; i++) if (numbers[i] + 1 === numbers[i+1]) consecs++;
        if (sum >= 100 && sum <= 170) score += 40; else if (sum >= 80 && sum <= 200) score += 20;
        if (odds >= 2 && odds <= 4) score += 30; if (highs >= 2 && highs <= 4) score += 20;
        if (consecs <= 1) score += 10;
        statSum.textContent = `${sum} (${sum >= 100 && sum <= 170 ? '이상적' : '희귀'})`;
        statOddEven.textContent = `${odds}:${6-odds}`;
        statHighLow.textContent = `${6-highs}:${highs}`;
        statConsecutive.textContent = `${consecs}회`;
    } else if (currentGame === 'pension') {
        const digits = numbers.slice(1);
        sum = digits.reduce((a, b) => a + b, 0);
        const unique = new Set(digits).size;
        if (sum >= 20 && sum <= 35) score += 50; if (unique >= 4) score += 50;
        statSum.textContent = `${sum} (0~54)`;
        statOddEven.textContent = `다양성: ${unique}/6`;
        statHighLow.textContent = `조: ${numbers[0]}`;
        statConsecutive.textContent = `순차조합`;
    } else if (currentGame === 'powerball') {
        const general = numbers.slice(0, 5);
        sum = general.reduce((a, b) => a + b, 0);
        const pball = numbers[5];
        if (sum >= 72 && sum <= 113) score += 60; if (pball >= 2 && pball <= 7) score += 40;
        statSum.textContent = `${sum} (72~113)`;
        statOddEven.textContent = `합계: ${sum}`;
        statHighLow.textContent = `파워볼: ${pball}`;
        statConsecutive.textContent = `균형분석`;
    }

    matchRate = Math.min(score, 100);
    animateScore(matchRate);
    matchBar.style.width = `${matchRate}%`;
    matchPercentage.textContent = `${Math.round(matchRate)}% Match`;
    scoreComment.textContent = getScoreComment(score);
}

function animateScore(target) {
    let current = 0;
    const interval = setInterval(() => {
        if (current >= target) { clearInterval(interval); overallScore.textContent = target; }
        else { current += 1; overallScore.textContent = current; }
    }, 15);
}

function getScoreComment(score) {
    if (score >= 80) return "🚀 10년 통계상 가장 강력한 당첨 확률을 가진 조합입니다!";
    if (score >= 60) return "⚖️ 균형 잡힌 데이터 분포를 보여주는 우수한 조합입니다.";
    if (score >= 40) return "⚠️ 통계적으로는 평범한 수준입니다.";
    return "🌋 확률적으로 매우 희귀한 패턴입니다. 신중한 선택이 필요합니다.";
}

// Theme
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

document.addEventListener('DOMContentLoaded', init);