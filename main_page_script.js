	// main_page_script.js

	//------------------- Constants -------------------

	const DEFAULT_DURATION = 60 * 60;
	const MAX_SCROLL_HEIGHT = 278;
	const ALPHABETS = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890~!@#$%^&*()_+-=/.,|[]}'"`;

	//------------------- Global Variables -------------------

	let started = false;
	let timeLeft = parseInt(localStorage.getItem('durationSelected')) || DEFAULT_DURATION;
	const freeway = timeLeft === DEFAULT_DURATION;
	let timeElapsed = 0;
	let errors = 0;
	let lastWord = "";
	let backspaces = 0;
	let spaces = 0;
	let currentWordIndex = 0; //keep track of the index of the word that the user is currently working on
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
	let contentBoxWordshown = 0;
	let currentPageTyped = false;
	let currentPageTypedWordCount = 0;
	let continuousWrongCount = 0;
	let isTypingPaused = false;
	let correctKeyHits = {};  
	let missedKeyHits = {};  
	let lineNumber = 0;
	let firstrow = [];
	let newpara = false;
	
	let inputPanel = document.getElementById("txtera");
	//let lineheight = inputPanel.getBoundingClientRect().height;
	let contentPanel = document.querySelector("#contentbox");
	let digitalClock = document.getElementById('digitalClock');
	let overlayPanel = document.getElementById('panel-clone');
	let alerttitle = document.getElementById('alerttitle');
	let alertmsg = document.getElementById('alertmsg');

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
	        contentBoxWordshown++;
	        currentWordCount++;
	    }

	    initTypingArea();
	}

	function initTypingArea() {
	    highlightWord(0);
	    inputPanel.innerHTML += `<span id="inpw${typedWordsArray.length}" class="inpw"></span>`;
	    //inputPanel.scrollTop = inputPanel.scrollHeight;
	}

	//------------------- Typing Logic -------------------

	document.addEventListener("keydown", handleKeyDown);

	function handleKeyDown(e) {
		if (isTypingPaused && e.key === "Enter") {
	        isTypingPaused = false;
	        overlayPanel.style.display = 'none';
	        continuousWrongCount = 0;
	        startTimer();
	        return;
	    } else if (gameIsOver && e.key === "Enter") {
	    	window.location.href = "result_page.html";
	    	return;
	    } else if (isTypingPaused || gameIsOver) {
	    	overlayPanel.style.display = 'block';
	    	console.log('Typing paused...\nPress Enter to continue.');
	    	return;
	    } else if (e.key === "Enter") {
	    	newpara = true;
	    	handleSpacebarKey(e);
	    }

	    totalTypedText = inputPanel.innerText;
	    totalTypedTextLength = totalTypedText.length;

	    if (ALPHABETS.includes(e.key)) {
	        handleAlphaNumericKey(e.key);
	    } else if (e.key === "Backspace") {
	        handleBackspaceKey(e);
	    } else if (e.key === " " && lastWord !== "") {
	        handleSpacebarKey(e);
	    }
	}

	function handleAlphaNumericKey(key) {
	    
	    currentCharIndex++;
	    totalStrokes++;
	    key === '-' ? lastWord += '\u2011' : lastWord += key; //prevent unexpected word-breaking

	    const correctChar = contentWords[currentWordIndex][lastWord.length - 1];
	    if (lastWord.length <= contentWords[currentWordIndex].length) {
		    if (key !== correctChar) {
		        diffKeys.push(key);
		        missedKeyHits[correctChar] = (missedKeyHits[correctChar] || 0) + 1;
		    } else {
		    	correctKeyHits[key] = (correctKeyHits[key] || 0) + 1; 
		    }
		} else {
		        extraKeys.push(key);
		    }

	    document.querySelector(`#inpw${typedWordsArray.length}`).innerHTML = lastWord;
	    backspaces++;

	    if (totalStrokes === 1) {
	    	startTimer();
	    	startStopwatch();
	    	document.querySelector('#txtera').removeChild(document.querySelector('#txtera').firstChild);
	    }

	   if (inputPanel.getBoundingClientRect().height > 232) { 
	   		firstrow.forEach(item => item.remove());
	   		firstrow.length = 0;
	   		while (inputPanel.firstChild && inputPanel.firstChild.nodeType === 3) {
			    inputPanel.firstChild.remove();
			}
	   }

	}

	function handleBackspaceKey(e) {
	    if (backspaces === 0) {
	        e.preventDefault();
	        return;
	    }

	    e.preventDefault(); // To prevent browser default behavior
	    lastWord = lastWord.slice(0, -1);
	    document.querySelector(`#inpw${typedWordsArray.length}`).innerHTML = lastWord;
	    backspaces--;
	    currentCharIndex--;
	}

	function handleSpacebarKey(e) {
	    e.preventDefault();

	    if ((currentWordIndex+1) >= totalWordsInContent) {
	        if (timeLeft > 0) {
	        	contentBoxWordshown = 0;
	            currentWordCount = 0;
	            currentWordIndex = 0;
	            reloadContent();
	            return;
	        }
	    }

	    totalWordsTyped++;
	    typedWordsArray.push(lastWord);
	    currentPageTypedWordCount++;
	    spaces++;
	    checkInputWord();

	    updateWordHighlighting();
	    prepareForNextWord();

	    if (currentPageTypedWordCount === contentBoxWordshown) {
	    	
	        if (timeLeft > 0) {
	            reloadContent(); 
	        } else {
	        	overlayPanel.style.display = "block";
		        alerttitle.innerText = 'Exercise completed.';
		        alertmsg.innerText = 'Press Enter to continue.';
	            endGame();
	        }
	    }

	    let elemtop = inputPanel.getBoundingClientRect().top;
	    if (inputPanel.getBoundingClientRect().height > 200) { 
	    		for (let d=0; d<document.querySelectorAll('.inpw').length; d++) {
	    			if (document.querySelectorAll('.inpw')[d].getBoundingClientRect().top === elemtop) {
	    				if (!firstrow.includes(document.querySelectorAll('.inpw')[d])) {
	    					firstrow.push(document.querySelectorAll('.inpw')[d]);
	    				}
	    			}
	    		}
	    	}
	    }

	function prepareForNextWord() {
	    lastWord = "";
	    backspaces = 0;
	    currentCharIndex = 0;
	    currentWordIndex++;
	    if (currentWordIndex < totalWordsInContent) {
	        if (newpara === false) {
	        	inputPanel.innerHTML += `&nbsp;<span id="inpw${typedWordsArray.length}" class="inpw"></span>`;
	        } else {
	        	newpara = false;
	        	inputPanel.innerHTML += `<span class="newpara" style="display:block"></span>`; //&#x21B5;
	        	inputPanel.innerHTML += `<span id="inpw${typedWordsArray.length}" class="inpw"></span>`;
	        }
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

	    if (typedWord.replace(/\u2011/g, '-') === correctWord) {
	        correctWords++;
	        continuousWrongCount = 0; // Reset on correct word
	    } else {
	        wrongWords++;
	        continuousWrongCount++;

		    if (continuousWrongCount > 10) {
		        isTypingPaused = true;
		        clearInterval(timer); //pause the timer
		        timer = null;
		        overlayPanel.style.display = 'block';
		        alerttitle.innerText = 'Typing paused.';
		        alertmsg.innerText = 'Too many incorrect words. Take a break, or press Enter to continue.';
		    }
	        markWordAsIncorrect();
	    }
	}

	function markWordAsIncorrect() {
	    const inputSpan = document.querySelector(`#inpw${typedWordsArray.length - 1}`);
	    if (inputSpan) {
	        inputSpan.style.textDecoration = "underline";
	        inputSpan.style.textDecorationColor = "#e94f69";
	    }

	    const correctWord = contentWords[currentWordIndex];
	    const typedWord = typedWordsArray[typedWordsArray.length - 1];

	    for (let i = 0; i < correctWord.length; i++) {
	        if (typedWord[i] !== correctWord[i]) {
	            missedKeys.push(correctWord[i]);
	            missedKeyHits[correctWord[i]] = (missedKeyHits[correctWord[i]] || 0) + 1;
	        } else {
	        	correctKeyHits[typedWord[i]] = (correctKeyHits[typedWord[i]] || 0) + 1;
	        }
	    }
	}

	function reloadContent() {

	    contentPanel.innerHTML = ""; // Clear existing content
	    currentPageTypedWordCount = 0;
	    updateContent(); // Update content with the next batch of words
	}

	//------------------- Timer -------------------

	function startTimer() {
    if (!timer) {
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

	    var minutes = Math.floor(timeLeft / 60);
	    var seconds = timeLeft % 60;
	    var formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	    freeway !== true ? digitalClock.innerText = formattedTime : false;
	}

	//------------------- Game Over -------------------

	function endGame() {
	    gameIsOver = true;
	    clearInterval(timer);
	    timer = null;
	    inputPanel.addEventListener("keydown", e => e.preventDefault());

	    let errorHits = wrongWords * 5;
	    let grossStrokes = typedWordsArray.reduce((sum, word) => sum + word.length, 0);
	    let netStrokes = Math.max(0, grossStrokes - errorHits);

	    let accuracy = grossStrokes > 0 ? Math.round((netStrokes / grossStrokes) * 100) : 0;
	    let grossSpeed = Math.round(((grossStrokes / 5) / timeElapsed) * 60);
	    let netSpeed = Math.round(((netStrokes / 5) / timeElapsed) * 60);

	    countCharFrequencies([...diffKeys, ...extraKeys, ...missedKeys, ...prevDiffKeys]);

	    //const charFrequencyArray = Object.entries(charFreq).sort((a, b) => b[1] - a[1]);
		let difficultKeys = [];

		Object.keys(missedKeyHits).forEach(key => {
		    const misses = missedKeyHits[key] || 0;
		    const hits = correctKeyHits[key] || 0;
		    const total = hits + misses;

		    if (total > 0) {
		        const frequency = misses / total;
		        if (frequency >= 0.1) {
		            difficultKeys.push([key, frequency]);
		        }
		    }
		});

		// Sort by frequency descending
		difficultKeys.sort((a, b) => b[1] - a[1]);

		sortedDiffKeys = difficultKeys.map(item => item[0]);
		sortedFreqs = difficultKeys.map(item => Math.round(item[1] * 100));

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
	        localStorage.setItem("msgHead", "Test Passed");
	        if (accuracy >= 70) {
	        	localStorage.setItem("msgBody", "You completed this typing test.");
	        } else if (accuracy < 70) {
	        	localStorage.setItem("msgBody", "Keep focused while typing to get more accuracy.");
	        }
	    } else {
	    	localStorage.setItem("msgHead", "Test Intruppted")
	        localStorage.setItem("message", "You have typed for very short time - your performance scores cannot be calculated.");
	    }
	    //console.log('Gross Speed: ', grossSpeed, '\nNet Speed: ', netSpeed, '\nAccuracy: ', accuracy, '\nTime Used: ', timeElapsed, '\nDifficult Keys: ', sortedDiffKeys, '\nFrequencies: ', sortedFreqs);
	}

	function showResults() {
		if (timeLeft > 0) {

		} else {

		}
		endGame();
		window.location.href = "result_page.html";
	}

//////////////////// Stopwatch Ellipse ////////////////////
    
    var canvas = document.getElementById("timer");
    var ctx = canvas.getContext("2d");

    // Initial canvas size
    canvas.width = 126;
    canvas.height = 76;
    canvas.style.borderRadius = '50%';

    var canvasWidth, canvasHeight, radiusX, radiusY;
    var durationSelected = parseInt(localStorage.getItem('durationSelected')) || DEFAULT_DURATION;

    var startAngle = -Math.PI / 2;
    var sliceAngle = 2 * Math.PI / durationSelected;
    var endAngle = startAngle;
    var interval = 1000;
    var totalSlices = 0;
    var slicesDrawn = 0;
    var timerAnimation;

    function startStopwatch() {
        totalSlices = durationSelected;
        endAngle = startAngle;
        slicesDrawn = 0;

        if (totalSlices === 0) {
            console.log("Free mode - no timer");
            drawStaticCircle();
            return;
        }

        timerAnimation = setInterval(function() {
            endAngle += sliceAngle;
            drawPie();
            slicesDrawn++;
            
            if (slicesDrawn >= totalSlices) {
                clearInterval(timerAnimation);
            }
        }, interval);
    }

    function drawPie() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Progress slice
        ctx.beginPath();
        ctx.moveTo(canvasWidth/2, canvasHeight/2);
        ctx.ellipse(canvasWidth/2, canvasHeight/2, radiusX, radiusY, 0, startAngle, endAngle);
        ctx.lineTo(canvasWidth/2, canvasHeight/2);
        ctx.fillStyle = "rgb(151, 193, 90)";
        ctx.fill();
    }

    function adjustCanvas() {
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        radiusX = canvasWidth / 2;
        radiusY = canvasHeight / 2;
        drawPie();
    }

    // Initialize
    adjustCanvas();
    
    // Make startTimer available globally for testing
    window.startTimer = startTimer;
