// --- Digital Sound Engine ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playHoverSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine'; // 디지털 느낌의 맑은 사인파
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 주파수 설정 (800Hz)
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05); // 주파수 상승 효과

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // 볼륨 조절 (작고 선명하게)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); // 짧게 사라짐

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
}

// Attach Sound to Elements
function attachHoverSounds() {
    const targets = 'a, button, .manual-input, .tab-btn';
    document.querySelectorAll(targets).forEach(el => {
        el.addEventListener('mouseenter', () => {
            playHoverSound();
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    attachHoverSounds();
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

// Auto Generation
generateButton.addEventListener('click', async () => {
    generateButton.disabled = true;
    generateButton.textContent = '추출 중... 🎰';
    numbersContainer.innerHTML = '';
    
    const numbers = generateLottoNumbers();
    updateStats(numbers, 'auto');
    
    for (const num of numbers) {
        const numElement = createNumberElement(num);
        numbersContainer.appendChild(numElement);
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    generateButton.disabled = false;
    generateButton.textContent = '번호 다시 생성하기 ✨';
});

// Manual Analysis
manualAnalyzeBtn.addEventListener('click', () => {
    const numbers = Array.from(manualInputs)
        .map(input => parseInt(input.value))
        .filter(num => !isNaN(num));

    // Validation
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
    
    // UI Update: Move to analysis section
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

function createNumberElement(num) {
    const el = document.createElement('div');
    el.classList.add('number');
    if (num <= 10) el.classList.add('num-1-10');
    else if (num <= 20) el.classList.add('num-11-20');
    else if (num <= 30) el.classList.add('num-21-30');
    else if (num <= 40) el.classList.add('num-31-40');
    else el.classList.add('num-41-45');
    el.textContent = num;
    return el;
}

function updateStats(numbers, mode) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const evens = 6 - odds;
    
    // Advanced Analysis for "Appropriateness"
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
    
    // 1. Sum Check (Ideal: 100-170)
    if (sum >= 100 && sum <= 170) balancePoints += 2;
    else if (sum >= 80 && sum <= 200) balancePoints += 1;
    
    // 2. Odd:Even Check (Ideal: 2:4, 3:3, 4:2)
    if (odds >= 2 && odds <= 4) balancePoints += 2;
    else if (odds >= 1 && odds <= 5) balancePoints += 1;
    
    // 3. Consecutive Numbers Check (Ideal: Max 2 consecutive)
    let consecutiveCount = 0;
    for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i] + 1 === numbers[i+1]) consecutiveCount++;
    }
    if (consecutiveCount <= 1) balancePoints += 2;
    else if (consecutiveCount === 2) balancePoints += 1;

    // Final Scoring
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