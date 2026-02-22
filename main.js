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
    osc.start(); osc.stop(audioCtx.currentTime + 0.07);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Hover Sounds
    document.querySelectorAll('button, a, input').forEach(el => {
        el.addEventListener('mouseenter', () => playSound('menuHover'));
    });

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeToggle.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        }
    }

    // Determine current page
    if (document.getElementById('tab-auto')) {
        initLottoTool();
    } else if (document.getElementById('results-body')) {
        initResultsHistory();
    }
});

// --- Lotto Tool Logic (Home Page) ---
function initLottoTool() {
    const tabAuto = document.getElementById('tab-auto');
    const tabManual = document.getElementById('tab-manual');
    const viewAuto = document.getElementById('view-auto');
    const viewManual = document.getElementById('view-manual');
    const btnGenerateAuto = document.getElementById('btn-generate-auto');
    const btnAnalyzeManual = document.getElementById('btn-analyze-manual');
    
    if (!tabAuto || !btnGenerateAuto) return;

    tabAuto.addEventListener('click', () => {
        playSound('click');
        tabAuto.classList.add('active');
        tabManual.classList.remove('active');
        viewAuto.style.display = 'block';
        viewManual.style.display = 'none';
        document.getElementById('analysis-report').style.display = 'none';
    });

    tabManual.addEventListener('click', () => {
        playSound('click');
        tabManual.classList.add('active');
        tabAuto.classList.remove('active');
        viewManual.style.display = 'block';
        viewAuto.style.display = 'none';
        document.getElementById('analysis-report').style.display = 'none';
    });

    btnGenerateAuto.addEventListener('click', async () => {
        playSound('click');
        btnGenerateAuto.disabled = true;
        btnGenerateAuto.textContent = '조합 추출 중... 🎰';
        const display = document.getElementById('auto-numbers-display');
        display.innerHTML = '';
        document.getElementById('analysis-report').style.display = 'none';

        const numbers = Array.from({length: 45}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 6).sort((a,b)=>a-b);
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

    btnAnalyzeManual.addEventListener('click', () => {
        playSound('click');
        const inputs = document.querySelectorAll('.manual-inputs input');
        const numbers = Array.from(inputs).map(i => parseInt(i.value)).filter(v => !isNaN(v));
        if (numbers.length < 6) { alert('6개의 번호를 모두 입력해주세요!'); return; }
        if (new Set(numbers).size !== 6) { alert('중복된 번호가 있습니다!'); return; }
        if (numbers.some(n => n < 1 || n > 45)) { alert('1~45 사이의 숫자만 입력 가능합니다!'); return; }
        runProfessionalAnalysis(numbers.sort((a,b)=>a-b), '입력 번호');
    });
}

// --- Results History Page Logic ---
let currentMaxRound = 0;
const BASE_ROUND = 1153; // Start from 2025 Jan

async function initResultsHistory() {
    const resultsBody = document.getElementById('results-body');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    // Calculate current round
    const today = new Date();
    const startDate = new Date(2025, 0, 4);
    const weeksDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 7));
    currentMaxRound = BASE_ROUND + weeksDiff;
    
    // Load last 10 rounds for first view
    await loadRounds(currentMaxRound, 10);
    loadingSpinner.style.display = 'none';
    
    const btnLoadMore = document.getElementById('btn-load-more');
    btnLoadMore.style.display = 'inline-block';
    btnLoadMore.addEventListener('click', async () => {
        playSound('click');
        const lastLoadedRound = parseInt(resultsBody.lastElementChild.dataset.round);
        await loadRounds(lastLoadedRound - 1, 10);
    });
}

async function loadRounds(startRound, count) {
    const resultsBody = document.getElementById('results-body');
    const endRound = Math.max(BASE_ROUND, startRound - count + 1);
    
    for (let r = startRound; r >= endRound; r--) {
        try {
            const targetUrl = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r}`;
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
            const data = await response.json();
            
            if (data.returnValue === "success") {
                const row = document.createElement('tr');
                row.dataset.round = data.drwNo;
                
                const numbersArr = [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6];
                const numsHtml = numbersArr.map(n => `<div class="number ${getBallColorClass(n)}">${n}</div>`).join('');
                
                row.innerHTML = `
                    <td>${data.drwNo}회</td>
                    <td>${data.drwNoDate}</td>
                    <td><div class="numbers-display">${numsHtml}</div></td>
                    <td><div class="numbers-display"><div class="number ${getBallColorClass(data.bnusNo)}">${data.bnusNo}</div></div></td>
                `;
                resultsBody.appendChild(row);
            }
        } catch (e) {
            console.error('Error loading round', r, e);
        }
    }
}

function getBallColorClass(val) {
    if (val <= 10) return 'num-1-10';
    if (val <= 20) return 'num-11-20';
    if (val <= 30) return 'num-21-30';
    if (val <= 40) return 'num-31-40';
    return 'num-41-45';
}

function runProfessionalAnalysis(numbers, type) {
    const reportSection = document.getElementById('analysis-report');
    if (!reportSection) return;
    reportSection.style.display = 'block';
    document.getElementById('current-analyzed-numbers').textContent = `${type}: ${numbers.join(', ')}`;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const highs = numbers.filter(n => n >= 23).length;
    let consecs = 0;
    for (let i = 0; i < numbers.length - 1; i++) if (numbers[i] + 1 === numbers[i+1]) consecs++;
    let points = 0;
    if (sum >= 100 && sum <= 170) points++;
    if (odds >= 2 && odds <= 4) points++;
    if (highs >= 2 && highs <= 4) points++;
    if (consecs <= 1) points++;
    let grade, desc, icon;
    if (points === 4) { grade = "최적의 통계적 밸런스"; desc = "모든 통계 지표가 역대 당첨 데이터의 최빈값 범위에 속하는 매우 안정적인 조합입니다."; icon = "⚖️"; }
    else if (points === 3) { grade = "안정적인 표준 조합"; desc = "대부분의 지표가 표준 분포 내에 있으며, 균형 잡힌 확률적 구성을 보여줍니다."; icon = "✅"; }
    else if (points === 2) { grade = "도전적인 실험적 패턴"; desc = "일부 지표가 희귀 패턴을 포함하고 있습니다."; icon = "🚀"; }
    else { grade = "희귀한 변칙적 패턴"; desc = "통계적으로 출현 빈도가 낮은 극단적인 구성입니다."; icon = "🌋"; }
    document.getElementById('pattern-grade').textContent = grade;
    document.getElementById('pattern-desc').textContent = desc;
    document.getElementById('status-icon').textContent = icon;
    document.getElementById('val-sum').textContent = sum;
    document.getElementById('val-odd-even').textContent = `${odds}:${6-odds}`;
    document.getElementById('val-high-low').textContent = `${6-highs}:${highs}`; 
    document.getElementById('val-consecutive').textContent = `${consecs}회`;
    reportSection.scrollIntoView({ behavior: 'smooth' });
}