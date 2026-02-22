// --- Advanced Digital Sound Engine ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    switch(type) {
        case 'menuHover': // 메뉴 전용 디지털음 (데이터 전송 느낌)
            osc.type = 'square';
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.03);
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
            break;
        case 'standardHover': // 일반 버튼 오버 (비프음)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
            break;
        case 'click': // 클릭 사운드 (짧고 선명한 스냅)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
            break;
        case 'rolling': // 슬롯머신 롤링음 (낮은 비프음)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            break;
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
}

// Attach Interaction Sounds
function initInteractions() {
    // Menu Hover
    document.querySelectorAll('.nav-menu a, .nav-logo').forEach(el => {
        el.addEventListener('mouseenter', () => playSound('menuHover'));
        el.addEventListener('click', () => playSound('click'));
    });
    
    // Standard Hover & Click
    document.querySelectorAll('button, .tab-btn, .manual-input').forEach(el => {
        el.addEventListener('mouseenter', () => playSound('standardHover'));
        el.addEventListener('click', () => playSound('click'));
    });
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    initInteractions();
});

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const generateButton = document.getElementById('generate-button');
const numbersContainer = document.getElementById('numbers-container');
const oddEvenStats = document.getElementById('odd-even-stats');
const sumStats = document.getElementById('sum-stats');

// Manual Input Elements
const autoModeBtn = document.getElementById('auto-mode-btn');
const manualModeBtn = document.getElementById('manual-mode-btn');
const autoView = document.getElementById('auto-generator-view');
const manualView = document.getElementById('manual-generator-view');
const manualInputs = document.querySelectorAll('.manual-input');
const manualAnalyzeBtn = document.getElementById('manual-analyze-button');

// Dark Mode logic
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
});

// Tab Switching
autoModeBtn.addEventListener('click', () => {
    autoModeBtn.classList.add('active');
    manualModeBtn.classList.remove('active');
    autoView.style.display = 'block';
    manualView.style.display = 'none';
});

manualModeBtn.addEventListener('click', () => {
    manualModeBtn.classList.add('active');
    autoModeBtn.classList.remove('active');
    manualView.style.display = 'block';
    autoView.style.display = 'none';
});

// Slot Machine Lotto Generation
generateButton.addEventListener('click', async () => {
    generateButton.disabled = true;
    generateButton.textContent = '행운 번호 추출 중... 🎰';
    numbersContainer.innerHTML = '';
    
    const finalNumbers = generateLottoNumbers();
    
    // Create placeholders for the 6 numbers
    const ballElements = [];
    for (let i = 0; i < 6; i++) {
        const ball = document.createElement('div');
        ball.classList.add('number', 'spinning');
        ball.textContent = Math.floor(Math.random() * 45) + 1;
        numbersContainer.appendChild(ball);
        ballElements.push(ball);
    }

    // Slot Machine Effect: Rolling for each ball
    for (let i = 0; i < 6; i++) {
        const ball = ballElements[i];
        const finalNum = finalNumbers[i];
        
        // Duration increases for each subsequent ball for dramatic effect
        const rollingDuration = 600 + (i * 300); 
        const interval = setInterval(() => {
            ball.textContent = Math.floor(Math.random() * 45) + 1;
            playSound('rolling');
        }, 80);

        await new Promise(resolve => setTimeout(resolve, rollingDuration));
        
        // Stop rolling and set final number
        clearInterval(interval);
        ball.classList.remove('spinning');
        ball.textContent = finalNum;
        
        // Apply color based on range
        if (finalNum <= 10) ball.classList.add('num-1-10');
        else if (finalNum <= 20) ball.classList.add('num-11-20');
        else if (finalNum <= 30) ball.classList.add('num-21-30');
        else if (finalNum <= 40) ball.classList.add('num-31-40');
        else ball.classList.add('num-41-45');
        
        playSound('standardHover'); // Final "pop" sound
    }
    
    updateStats(finalNumbers, 'auto');
    generateButton.disabled = false;
    generateButton.textContent = '번호 다시 생성하기 ✨';
});

// Manual Analysis
manualAnalyzeBtn.addEventListener('click', () => {
    const numbers = Array.from(manualInputs)
        .map(input => parseInt(input.value))
        .filter(num => !isNaN(num));

    if (numbers.length < 6) {
        alert('6개의 번호를 모두 입력해주세요!');
        return;
    }
    if (new Set(numbers).size !== 6) {
        alert('중복된 번호가 있습니다!');
        return;
    }
    if (numbers.some(n => n < 1 || n > 45)) {
        alert('1~45 사이의 숫자만 입력 가능합니다!');
        return;
    }

    numbers.sort((a, b) => a - b);
    updateStats(numbers, 'manual');
    document.getElementById('analysis').scrollIntoView({ behavior: 'smooth' });
});

// Helper Functions
function generateLottoNumbers() {
    const numbers = [];
    while (numbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    return numbers.sort((a, b) => a - b);
}

function updateStats(numbers, mode) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const evens = 6 - odds;
    
    const score = calculateBalanceScore(numbers, sum, odds);
    
    oddEvenStats.innerHTML = `
        <span style="color: #e74c3c">홀수 ${odds}</span> : <span style="color: #3498db">짝수 ${evens}</span>
        <div class="stats-detail">(${odds}:${evens} 비율)</div>
    `;
    
    sumStats.innerHTML = `
        총합: ${sum} 
        <div class="stats-detail">${mode === 'manual' ? '입력하신 번호 조합' : '추천 드린 조합'}의 총합입니다.</div>
        <span class="score-badge ${score.class}">${score.text}</span>
    `;
}

function calculateBalanceScore(numbers, sum, odds) {
    let balancePoints = 0;
    if (sum >= 100 && sum <= 170) balancePoints += 2;
    else if (sum >= 80 && sum <= 200) balancePoints += 1;
    if (odds >= 2 && odds <= 4) balancePoints += 2;
    else if (odds >= 1 && odds <= 5) balancePoints += 1;
    let consecutiveCount = 0;
    for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i] + 1 === numbers[i+1]) consecutiveCount++;
    }
    if (consecutiveCount <= 1) balancePoints += 2;
    else if (consecutiveCount === 2) balancePoints += 1;
    if (balancePoints >= 5) return { text: '✨ 통계적으로 우수한 균형 조합', class: 'score-good' };
    if (balancePoints >= 3) return { text: '⚖️ 무난한 평균적 조합', class: 'score-average' };
    return { text: '🌋 확률적으로 희귀한 패턴', class: 'score-rare' };
}

// Smooth scrolling for navigation
document.querySelectorAll('.nav-menu a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            window.scrollTo({
                top: targetSection.offsetTop - 70,
                behavior: 'smooth'
            });
        }
    });
});