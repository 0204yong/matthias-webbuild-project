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
        title: "Lucky Lotto 6/45 🍀",
        desc: "1부터 45까지, 당신의 행운을 결정할 6개의 숫자",
        rules: "6/45",
        generate: () => Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b)
    },
    pension: {
        title: "Pension 720+ 🏠",
        desc: "1~5조 중 1개 + 0~9 사이의 6자리 숫자 조합",
        rules: "Group + 6Digits",
        generate: () => [Math.floor(Math.random()*5)+1, ...Array.from({length: 6}, () => Math.floor(Math.random()*10))]
    },
    powerball: {
        title: "Powerball 🎰",
        desc: "일반볼 5개(1~28) + 파워볼 1개(0~9)",
        rules: "5General + 1Power",
        generate: () => {
            const general = Array.from({length: 28}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 5).sort((a,b)=>a-b);
            const power = Math.floor(Math.random()*10);
            return [...general, power];
        }
    }
};

let currentGame = 'lotto';

// --- UI Elements ---
const gameBtns = document.querySelectorAll('.game-btn');
const numbersContainer = document.getElementById('numbers-container');
const generateButton = document.getElementById('generate-button');
const gameTitle = document.getElementById('game-title');
const gameDesc = document.getElementById('game-desc');
const balanceStats = document.getElementById('balance-stats');
const detailStats = document.getElementById('detail-stats');

// --- Initialization ---
gameBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => playSound('menuHover'));
    btn.addEventListener('click', () => {
        playSound('click');
        gameBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGame = btn.dataset.game;
        updateGameUI();
    });
});

function updateGameUI() {
    const config = GAMES[currentGame];
    gameTitle.textContent = config.title;
    gameDesc.textContent = config.desc;
    numbersContainer.innerHTML = '';
    balanceStats.innerHTML = '대기 중...';
    detailStats.innerHTML = '번호를 생성해주세요.';
}

// --- Generation with Animation ---
generateButton.addEventListener('click', async () => {
    playSound('click');
    generateButton.disabled = true;
    generateButton.textContent = '행운 추출 중... 🎰';
    numbersContainer.innerHTML = '';

    const config = GAMES[currentGame];
    const finalNumbers = config.generate();
    const ballCount = finalNumbers.length;
    
    // Create placeholders
    const ballElements = [];
    for (let i = 0; i < ballCount; i++) {
        const ball = document.createElement('div');
        ball.classList.add('number', 'spinning');
        
        // Label Group or Powerball
        if(currentGame === 'pension' && i === 0) ball.textContent = '조';
        else if(currentGame === 'powerball' && i === 5) ball.textContent = 'P';
        else ball.textContent = '?';
        
        numbersContainer.appendChild(ball);
        ballElements.push(ball);
    }

    // Rolling Animation
    for (let i = 0; i < ballCount; i++) {
        const ball = ballElements[i];
        const finalVal = finalNumbers[i];
        const duration = 500 + (i * 200);
        
        const interval = setInterval(() => {
            if(currentGame === 'pension' && i === 0) ball.textContent = Math.floor(Math.random()*5)+1;
            else if(currentGame === 'powerball' && i === 5) ball.textContent = Math.floor(Math.random()*10);
            else if(currentGame === 'lotto') ball.textContent = Math.floor(Math.random()*45)+1;
            else ball.textContent = Math.floor(Math.random()*10);
            playSound('rolling');
        }, 80);

        await new Promise(resolve => setTimeout(resolve, duration));
        clearInterval(interval);
        
        ball.classList.remove('spinning');
        ball.textContent = (currentGame === 'pension' && i === 0) ? finalVal + '조' : finalVal;
        
        // Apply Special Styles
        applyBallStyles(ball, finalVal, i);
        playSound('pop');
    }

    analyzeGame(finalNumbers);
    generateButton.disabled = false;
    generateButton.textContent = '다시 생성하기 ✨';
});

function applyBallStyles(ball, val, index) {
    if(currentGame === 'lotto') {
        if (val <= 10) ball.classList.add('num-1-10');
        else if (val <= 20) ball.classList.add('num-11-20');
        else if (val <= 30) ball.classList.add('num-21-30');
        else if (val <= 40) ball.classList.add('num-31-40');
        else ball.classList.add('num-41-45');
    } else if(currentGame === 'pension') {
        if(index === 0) ball.classList.add('num-group');
        else ball.classList.add('num-pension');
    } else if(currentGame === 'powerball') {
        if(index === 5) ball.classList.add('num-powerball');
        else ball.classList.add('num-11-20'); // Blue for general
    }
}

function analyzeGame(numbers) {
    if(currentGame === 'lotto') {
        const sum = numbers.reduce((a, b) => a + b, 0);
        const odds = numbers.filter(n => n % 2 !== 0).length;
        balanceStats.innerHTML = `<span class="score-badge ${sum >= 100 && sum <= 170 ? 'score-good' : 'score-average'}">총합: ${sum}</span>`;
        detailStats.innerHTML = `홀짝 비율 ${odds}:${6-odds}`;
    } else if(currentGame === 'pension') {
        balanceStats.innerHTML = `<span class="score-badge score-good">순차적 생성 완료</span>`;
        detailStats.innerHTML = `${numbers[0]}조 ${numbers.slice(1).join('')} 번호 조합입니다.`;
    } else if(currentGame === 'powerball') {
        balanceStats.innerHTML = `<span class="score-badge score-good">파워볼 조합 완성</span>`;
        detailStats.innerHTML = `일반볼 합계: ${numbers.slice(0,5).reduce((a,b)=>a+b,0)} / 파워볼: ${numbers[5]}`;
    }
}

// (Theme and navigation code remain same)
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});