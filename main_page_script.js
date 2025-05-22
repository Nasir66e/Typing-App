// main_page_script.js

//------------------- Constants -------------------

const DEFAULT_DURATION = 60;
const MAX_SCROLL_HEIGHT = 278;
const ALPHABETS = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890~!@#$%^&*()_+-=/.,|[]}'"`;

//------------------- Global Variables -------------------

let started = false;
let timeLeft = parseInt(localStorage.getItem('durationSelected')) || DEFAULT_DURATION;
let timeElapsed = 0;
let errors = 0;
let lastWord = "";
let backspaces = 0;
let spaces = 0;
let currentWordIndex = 0;
let currentCharIndex = 0;
let totalTypedTextLength = 0;
let totalTypedText = "";
let typedWordsArray = [];
let correctWords = 0;
let wrongWords = 0;
let totalWordsInContent = 0;
let totalWordsTyped = 0;
let totalStrokes = 0;
let timer = null;
let gameIsOver = false;
let extraKeys = [];
let diffKeys = [];
let missedKeys = [];
let charFreq = {};
let sortedDiffKeys = [];
let sortedFreqs = [];
let prevDiffKeys = JSON.parse(localStorage.getItem('prevDiffKeys') || '[]');
let currentWordCount = 0;
let content = [];
let contentWords = [];

let inputPanel = document.getElementById("txtera");
let contentPanel = document.querySelector("#contentbox");
let digitalClock = document.getElementById('digitalClock');

//------------------- Event Blockers -------------------

document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("paste", e => e.preventDefault());
inputPanel.addEventListener("dragstart", e => e.preventDefault());
inputPanel.addEventListener("select", e => e.preventDefault());

//------------------- Fetch and Load Content -------------------

window.onload = () => fetchData();

async function fetchData() {
    try {
        const url = "content.json";
        const response = await fetch(url);
        const data = await response.json();

        let textKey = localStorage.getItem('text_data');
        if (!textKey || !data[textKey]) {
            console.error("Invalid or missing text data key");
            return;
        }

        content.push(data[textKey]);
        contentWords = content[0].split(" ");
        totalWordsInContent = contentWords.length;
        
        updateContent();
    } catch (error) {
        console.error("Error fetching content:", error);
    }
}

//------------------- Initialize UI -------------------

function updateContent() {
    const MAX_SCROLL_HEIGHT = 250; // Adjust if your design changes

    while (currentWordCount < totalWordsInContent) {
        const span = document.createElement("span");
        span.id = `c${currentWordCount}`;
        span.textContent = contentWords[currentWordCount] + " ";
        span.style.color = "#546e30";

        contentPanel.appendChild(span);

        // Check if adding this word overflowed the container
        if (contentPanel.scrollHeight > MAX_SCROLL_HEIGHT) {
            contentPanel.removeChild(span); // Remove last word
            break;
        }

        currentWordCount++;
    }

    initTypingArea();
}

function initTypingArea() {
    highlightWord(0);
    inputPanel.innerHTML += `<span id="inpw0"></span>`;
    inputPanel.scrollTop = inputPanel.scrollHeight;

    console.log(totalWordsInContent, ' &' , currentWordCount);
}

//------------------- Typing Logic -------------------

document.addEventListener("keydown", handleKeyDown);

function handleKeyDown(e) {
    if (gameIsOver) return;

    totalTypedText = inputPanel.innerText;
    totalTypedTextLength = totalTypedText.length;

    if (ALPHABETS.includes(e.key) && currentWordIndex < totalWordsInContent) {
        handleAlphaNumericKey(e.key);
    } else if (e.key === "Backspace") {
        handleBackspaceKey(e);
    } else if (e.key === " " && lastWord !== "") {
        handleSpacebarKey(e);
    }
}

function handleAlphaNumericKey(key) {
    if (totalWordsTyped === totalWordsInContent) {
        endGame();
        return;
    }

    currentCharIndex++;
    lastWord += key;
    totalStrokes++;

    const correctChar = contentWords[currentWordIndex][lastWord.length - 1];
    if (lastWord.length <= contentWords[currentWordIndex].length && key !== correctChar) {
        diffKeys.push(key);
    } else if (lastWord.length > contentWords[currentWordIndex].length) {
        extraKeys.push(key);
    }

    document.querySelector(`#inpw${totalWordsTyped}`).innerHTML = lastWord;
    backspaces++;

    if (totalStrokes === 1) startTimer();
}

function handleBackspaceKey(e) {
    if (backspaces === 0) {
        e.preventDefault();
        return;
    }

    e.preventDefault(); // To prevent browser default behavior
    lastWord = lastWord.slice(0, -1);
    document.querySelector(`#inpw${totalWordsTyped}`).innerHTML = lastWord;
    backspaces--;
    currentCharIndex--;
}

function handleSpacebarKey(e) {
    e.preventDefault();

    if (currentWordIndex >= totalWordsInContent) {
        endGame();
        return;
    }

    totalWordsTyped++;
    typedWordsArray.push(lastWord);
    spaces++;
    checkInputWord();

    updateWordHighlighting();
    prepareForNextWord();
    
    if (totalWordsTyped === currentWordCount) {
        if (timeLeft > 0) {
            console.log('Loading next page...');
            reloadContent(); // continue
        } else {
            endGame();
        }
    }
}

function prepareForNextWord() {
    lastWord = "";
    backspaces = 0;
    currentCharIndex = 0;
    currentWordIndex++;

    if (totalWordsTyped < totalWordsInContent && currentWordIndex < totalWordsInContent) {
        inputPanel.innerHTML += `&nbsp;<span id="inpw${totalWordsTyped}"></span>`;
        highlightWord(currentWordIndex);
    }
}

function updateWordHighlighting() {
    const prev = document.getElementById(`c${currentWordIndex}`);
    if (prev) {
        prev.style.color = "#546e30";
        prev.style.textDecoration = "none";
    }
}

function highlightWord(index) {
    const curr = document.getElementById(`c${index}`);
    if (curr) {
        curr.style.color = "#3f10cb";
        curr.style.textDecoration = "underline";
        curr.scrollIntoView({ behavior: "auto", block: "start" });
    }
}

function checkInputWord() {
    const correctWord = contentWords[currentWordIndex];
    const typedWord = typedWordsArray[typedWordsArray.length - 1];

    if (typedWord === correctWord) {
        correctWords++;
    } else {
        wrongWords++;
        markWordAsIncorrect();
    }
}

function markWordAsIncorrect() {
    const inputSpan = document.querySelector(`#inpw${totalWordsTyped - 1}`);
    if (inputSpan) {
        inputSpan.style.textDecoration = "underline";
        inputSpan.style.textDecorationColor = "#e94f69";
    }

    const correctWord = contentWords[currentWordIndex];
    const typedWord = typedWordsArray[typedWordsArray.length - 1];

    for (let i = 0; i < correctWord.length; i++) {
        if (typedWord[i] !== correctWord[i]) {
            missedKeys.push(correctWord[i]);
        }
    }
}

function reloadContent() {
    contentPanel.innerHTML = ""; // Clear existing content
    currentWordCount = 0; // Reset word count
    currentWordIndex = 0; // Reset word index
    totalWordsTyped = 0; // reset total words typed.
    inputPanel.innerHTML = `<span id="inpw0"></span>`; // reset the input panel.
    totalWordsInContent = contentWords.length; // reset total words in content.
    updateContent(); // Update content with the next batch of words
}

//------------------- Timer -------------------

function startTimer() {
    if (!started) {
        started = true;
        timer = setInterval(updateTimer, 1000);
    }
}

function updateTimer() {
    if (timeLeft <= 0) {
        endGame();
        return;
    }

    timeLeft--;
    timeElapsed++;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    digitalClock.innerText = formattedTime;
}

//------------------- Game Over -------------------

function endGame() {
    if (gameIsOver) return;

    gameIsOver = true;
    clearInterval(timer);
    inputPanel.addEventListener("keydown", e => e.preventDefault());

    let errorHits = wrongWords * 5;
    let grossStrokes = inputPanel.innerText.length;
    let netStrokes = Math.max(0, grossStrokes - errorHits);

    let accuracy = grossStrokes > 0 ? Math.round((netStrokes / grossStrokes) * 100) : 0;
    let grossSpeed = Math.round(((grossStrokes / 5) / timeElapsed) * 60);
    let netSpeed = Math.round(((netStrokes / 5) / timeElapsed) * 60);

    countCharFrequencies([...diffKeys, ...extraKeys, ...missedKeys, ...prevDiffKeys]);

    const charFrequencyArray = Object.entries(charFreq).sort((a, b) => b[1] - a[1]);
    sortedDiffKeys = charFrequencyArray.map(item => item[0]);
    sortedFreqs = charFrequencyArray.map(item => item[1]);

    saveResults(grossSpeed, netSpeed, accuracy);
}

function countCharFrequencies(arr) {
    arr.forEach(char => {
        charFreq[char] = (charFreq[char] || 0) + 1;
    });
}

function saveResults(grossSpeed, netSpeed, accuracy) {
    localStorage.setItem("gross-speed", grossSpeed);
    localStorage.setItem("net-speed", netSpeed);
    localStorage.setItem("accuracy", accuracy);
    localStorage.setItem("time-used", timeElapsed);
    localStorage.setItem("diffKeys", JSON.stringify(sortedDiffKeys));
    localStorage.setItem("frequencies", JSON.stringify(sortedFreqs));

    if (totalWordsTyped >= 5 && timeElapsed >= 10) {
        localStorage.setItem("message", "You completed this typing test.");
    } else {
        localStorage.setItem("message", "You have typed for very short time - your performance scores cannot be calculated.");
    }

    window.location.href = "result_page.html";
}
