const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '7️⃣'];

const reelElements = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
];

const spinButton = document.getElementById('spinButton');
const resultElement = document.getElementById('result');

function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

function spinReels() {
    let results = [];
    for (let i = 0; i < reelElements.length; i++) {
        const symbol = getRandomSymbol();
        reelElements[i].textContent = symbol;
        results.push(symbol);
    }
    return results;
}

function checkWin(results) {
    if (results[0] === results[1] && results[1] === results[2]) {
        return { win: true, message: `Jackpot! You got three ${results[0]}!` };
    } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
        return { win: true, message: `Nice! You got two matching symbols!` };
    } else {
        return { win: false, message: `Try again!` };
    }
}

spinButton.addEventListener('click', () => {
    spinButton.disabled = true;
    resultElement.textContent = 'Spinning...';

    // Simulate spinning animation
    let spinCount = 0;
    const maxSpins = 20;
    const spinInterval = setInterval(() => {
        const results = spinReels();
        spinCount++;
        if (spinCount >= maxSpins) {
            clearInterval(spinInterval);
            const finalResult = checkWin(results);
            resultElement.textContent = finalResult.message;
            spinButton.disabled = false;
        }
    }, 100);
});
