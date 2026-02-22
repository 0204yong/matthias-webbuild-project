const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const generateButton = document.getElementById('generate-button');
const numbersContainer = document.getElementById('numbers-container');
const oddEvenStats = document.getElementById('odd-even-stats');
const sumStats = document.getElementById('sum-stats');

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

// Lotto generation logic
generateButton.addEventListener('click', async () => {
    generateButton.disabled = true;
    generateButton.textContent = '추출 중... 🎰';
    
    numbersContainer.innerHTML = '';
    
    const numbers = [];
    while (numbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    numbers.sort((a, b) => a - b);
    
    // Analyze and update stats
    updateStats(numbers);
    
    for (const num of numbers) {
        const numElement = document.createElement('div');
        numElement.classList.add('number');
        
        if (num <= 10) numElement.classList.add('num-1-10');
        else if (num <= 20) numElement.classList.add('num-11-20');
        else if (num <= 30) numElement.classList.add('num-21-30');
        else if (num <= 40) numElement.classList.add('num-31-40');
        else numElement.classList.add('num-41-45');
        
        numElement.textContent = num;
        numbersContainer.appendChild(numElement);
        
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    generateButton.disabled = false;
    generateButton.textContent = '번호 다시 생성하기 ✨';
});

function updateStats(numbers) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const evens = 6 - odds;
    
    oddEvenStats.innerHTML = `<span style="color: #e74c3c">홀수 ${odds}</span> : <span style="color: #3498db">짝수 ${evens}</span>`;
    sumStats.innerHTML = `총합: ${sum} <br><small style="font-size: 0.8rem; color: var(--text-secondary)">(${sum >= 100 && sum <= 170 ? '적정 범위' : '특이 범위'})</small>`;
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