const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const generateButton = document.getElementById('generate-button');
const numbersContainer = document.getElementById('numbers-container');

// Dark Mode logic
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = 'Light Mode';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
});

// Lotto generation logic
generateButton.addEventListener('click', () => {
    const numbers = [];
    while (numbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    numbers.sort((a, b) => a - b);
    
    numbersContainer.innerHTML = '';
    numbers.forEach(num => {
        const numElement = document.createElement('div');
        numElement.classList.add('number');
        numElement.textContent = num;
        numbersContainer.appendChild(numElement);
    });
});