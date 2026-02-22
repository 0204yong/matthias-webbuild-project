const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const generateButton = document.getElementById('generate-button');
const numbersContainer = document.getElementById('numbers-container');

// Dark Mode logic
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = '☀️ Light Mode';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Lotto generation logic
generateButton.addEventListener('click', async () => {
    // Disable button during generation
    generateButton.disabled = true;
    generateButton.textContent = '추출 중... 🎰';
    
    // Clear container
    numbersContainer.innerHTML = '';
    
    // Generate numbers
    const numbers = [];
    while (numbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    numbers.sort((a, b) => a - b);
    
    // Animate numbers appearing one by one
    for (const num of numbers) {
        const numElement = document.createElement('div');
        numElement.classList.add('number');
        
        // Add color class based on range
        if (num <= 10) numElement.classList.add('num-1-10');
        else if (num <= 20) numElement.classList.add('num-11-20');
        else if (num <= 30) numElement.classList.add('num-21-30');
        else if (num <= 40) numElement.classList.add('num-31-40');
        else numElement.classList.add('num-41-45');
        
        numElement.textContent = num;
        numbersContainer.appendChild(numElement);
        
        // Small delay for animation feel
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Restore button
    generateButton.disabled = false;
    generateButton.textContent = '다시 생성하기 ✨';
});