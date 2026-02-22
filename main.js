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

// --- Interaction Helpers ---
document.addEventListener('DOMContentLoaded', () => {
    // Basic Hover sounds
    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => playSound('menuHover'));
    });
});

// --- Game Logic ---
const GAMES = {
    lotto: {
        inputs: 6, placeholders: ["1", "2", "3", "4", "5", "6"],
        generate: () => Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b)
    },
    pension: {
        inputs: 7, placeholders: ["조", "10만", "만", "천", "백", "십", "일"],
        generate: () => [Math.floor(Math.random()*5)+1, ...Array.from({length: 6}, () => Math.floor(Math.random()*10))]
    },
    powerball: {
        inputs: 6, placeholders: ["1", "2", "3", "4", "5", "P"],
        generate: () => {
            const general = Array.from({length: 28}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 5).sort((a,b)=>a-b);
            return [...general, Math.floor(Math.random()*10)];
        }
    }
};

// --- Core Handlers ---

async function handleAuto(gameId) {
    playSound('click');
    const display = document.getElementById(`${gameId}-display`);
    display.innerHTML = '';
    
    const config = GAMES[gameId];
    const finalNumbers = config.generate();
    const balls = [];

    // Create placeholders
    for (let i = 0; i < finalNumbers.length; i++) {
        const ball = document.createElement('div');
        ball.className = 'number spinning';
        ball.textContent = '?';
        display.appendChild(ball);
        balls.push(ball);
    }

    // Rolling animation
    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        const val = finalNumbers[i];
        const duration = 500 + (i * 150);
        
        const interval = setInterval(() => {
            if(gameId === 'lotto') ball.textContent = Math.floor(Math.random()*45)+1;
            else if(gameId === 'powerball' && i === 5) ball.textContent = Math.floor(Math.random()*10);
            else if(gameId === 'powerball') ball.textContent = Math.floor(Math.random()*28)+1;
            else ball.textContent = Math.floor(Math.random()*10);
            playSound('rolling');
        }, 80);

        await new Promise(r => setTimeout(r, duration));
        clearInterval(interval);
        
        ball.className = 'number';
        ball.textContent = (gameId === 'pension' && i === 0) ? val + '조' : val;
        applyBallStyles(ball, val, i, gameId);
        playSound('pop');
    }

    runAnalysis(finalNumbers, gameId);
}

function toggleManual(gameId) {
    playSound('click');
    const area = document.getElementById(`${gameId}-manual`);
    const inputContainer = document.getElementById(`${gameId}-inputs`);
    
    if (area.style.display === 'none') {
        area.style.display = 'block';
        inputContainer.innerHTML = '';
        const config = GAMES[gameId];
        for (let i = 0; i < config.inputs; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.placeholder = config.placeholders[i];
            inputContainer.appendChild(input);
        }
    } else {
        area.style.display = 'none';
    }
}

function handleManual(gameId) {
    playSound('click');
    const inputs = document.querySelectorAll(`#${gameId}-inputs input`);
    const numbers = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
    const config = GAMES[gameId];

    if (numbers.length < config.inputs) {
        alert('모든 칸을 입력해주세요!');
        return;
    }
    
    runAnalysis(numbers, gameId);
}

function applyBallStyles(ball, val, index, gameId) {
    if(gameId === 'lotto') {
        if (val <= 10) ball.classList.add('lotto-1-10');
        else if (val <= 20) ball.classList.add('lotto-11-20');
        else if (val <= 30) ball.classList.add('lotto-21-30');
        else if (val <= 40) ball.classList.add('lotto-31-40');
        else ball.classList.add('lotto-41-45');
    } else if(gameId === 'pension') {
        if(index === 0) ball.classList.add('pension-group');
        else ball.classList.add('pension-num');
    } else if(gameId === 'powerball') {
        if(index === 5) ball.classList.add('powerball-red');
        else ball.classList.add('lotto-11-20');
    }
}

// --- Analysis Engine ---

function runAnalysis(numbers, gameId) {
    const reportArea = document.getElementById('analysis-report');
    reportArea.style.display = 'block';
    
    let score = 0;
    let detailHTML = '';

    if (gameId === 'lotto') {
        const sum = numbers.reduce((a, b) => a + b, 0);
        const odds = numbers.filter(n => n % 2 !== 0).length;
        if (sum >= 100 && sum <= 170) score += 50;
        if (odds >= 2 && odds <= 4) score += 50;
        detailHTML = `<p>총합: ${sum} (${sum >= 100 && sum <= 170 ? '이상적' : '희귀'})</p><p>홀짝 비율: ${odds}:${6-odds}</p>`;
    } else if (gameId === 'pension') {
        score = 85; // Based on distribution
        detailHTML = `<p>조: ${numbers[0]}</p><p>번호: ${numbers.slice(1).join('')}</p>`;
    } else if (gameId === 'powerball') {
        const sum = numbers.slice(0, 5).reduce((a, b) => a + b, 0);
        if (sum >= 72 && sum <= 113) score += 70; else score += 30;
        detailHTML = `<p>일반합: ${sum}</p><p>파워볼: ${numbers[5]}</p>`;
    }

    animateScore(score);
    document.getElementById('report-details').innerHTML = detailHTML;
    document.getElementById('score-comment').textContent = score >= 80 ? "🚀 아주 강력한 당첨 확률을 가진 조합입니다!" : "⚖️ 균형 잡힌 데이터 분포입니다.";
    
    reportArea.scrollIntoView({ behavior: 'smooth' });
}

function animateScore(target) {
    let current = 0;
    const el = document.getElementById('overall-score');
    const interval = setInterval(() => {
        if (current >= target) { clearInterval(interval); el.textContent = target; }
        else { current++; el.textContent = current; }
    }, 15);
}

// Theme
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});