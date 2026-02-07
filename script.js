// Game state variables
let currentScore = 0;
let currentStreak = 0;
let highScore = 0;
let recordStreak = 0;
let selectedPrediction = null;
let isFlipping = false;
let leaderboard = [];
let lastCoinResult = null;
let lastResultMessage = "READY TO PLAY!";

// DOM elements
const coin = document.getElementById('coin');
const coinContainer = document.getElementById('coinContainer');
const currentScoreElement = document.getElementById('currentScore');
const streakElement = document.getElementById('streak');
const highScoreElement = document.getElementById('highScore');
const recordStreakElement = document.getElementById('recordStreak');
const lastResultElement = document.getElementById('lastResult');
const headsBtn = document.getElementById('headsBtn');
const tailsBtn = document.getElementById('tailsBtn');
const flipBtn = document.getElementById('flipBtn');
const addScoreBtn = document.getElementById('addScoreBtn');
const leaderboardBody = document.getElementById('leaderboardBody');
const playerModal = document.getElementById('playerModal');
const playerNameInput = document.getElementById('playerName');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const cancelSaveBtn = document.getElementById('cancelSaveBtn');
const finalScoreDisplay = document.getElementById('finalScoreDisplay');
const modalCloseBtn = document.getElementById('cancelSaveBtn');

// FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    push, 
    onValue,
    remove,
    query,
    orderByChild,
    limitToLast
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const appSettings = {
    databaseURL: "https://coin-flipping-game-default-rtdb.europe-west1.firebasedatabase.app/"
}

const app = initializeApp(appSettings);
const database = getDatabase(app);
const scoresRef = ref(database, "scores");

// Initialize the game
function initGame() {
    // Load saved data from localStorage
    loadSavedData();
    
    // Update the UI with initial values
    updateScoreDisplay();
    updateLastResult();
    
    // Load leaderboard from Firebase
    loadLeaderboardFromFirebase();
    
    // Set up event listeners
    setupEventListeners();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
}

// Load saved data from localStorage
function loadSavedData() {
    const savedHighScore = localStorage.getItem('coinFlipHighScore');
    const savedRecordStreak = localStorage.getItem('coinFlipRecordStreak');
    
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
    }
    
    if (savedRecordStreak) {
        recordStreak = parseInt(savedRecordStreak);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('coinFlipHighScore', highScore);
    localStorage.setItem('coinFlipRecordStreak', recordStreak);
}

// Update the score display with retro digital format
function updateScoreDisplay() {
    currentScoreElement.textContent = currentScore.toString().padStart(4, '0');
    streakElement.textContent = currentStreak;
    highScoreElement.textContent = highScore.toString().padStart(4, '0');
    recordStreakElement.textContent = recordStreak;
}

// Update last result display
function updateLastResult() {
    lastResultElement.textContent = lastResultMessage;
}

// Load leaderboard from Firebase
function loadLeaderboardFromFirebase() {
    leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #ffd700; font-family: Orbitron;">LOADING CASINO LEADERBOARD...</td></tr>';
    
    const scoresQuery = query(scoresRef, orderByChild('score'), limitToLast(20));
    
    onValue(scoresQuery, (snapshot) => {
        leaderboard = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            Object.keys(data).forEach(key => {
                leaderboard.push({
                    id: key,
                    ...data[key]
                });
            });
            
            leaderboard.sort((a, b) => b.score - a.score);
            
            const topScores = leaderboard.slice(0, 10);
            updateLeaderboardUI(topScores);
        } else {
            updateLeaderboardUI([]);
        }
    }, (error) => {
        console.error("Error loading leaderboard:", error);
        leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #ff0000; font-family: Orbitron;">CASINO ERROR: CANNOT CONNECT TO SERVER</td></tr>';
    });
}

// Update the leaderboard table with data
function updateLeaderboardUI(scores) {
    leaderboardBody.innerHTML = '';
    
    if (scores.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 40px; color: #ffd700; font-family: Orbitron;">
                🎰 NO SCORES YET • BE THE FIRST CASINO CHAMPION! 🎰
            </td>
        `;
        leaderboardBody.appendChild(row);
        return;
    }
    
    scores.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Add special styling for top 3
        if (index === 0) {
            row.className = 'first-place';
            row.innerHTML = `
                <td><span class="rank-badge">🥇</span> ${index + 1}</td>
                <td><span class="player-name">👑 ${entry.name}</span></td>
                <td><span class="high-score-value">${entry.score}</span></td>
                <td><span class="fire-emoji">🔥</span> ${entry.streak}</td>
                <td>${formatDate(entry.date)}</td>
            `;
        } else if (index === 1) {
            row.className = 'second-place';
            row.innerHTML = `
                <td><span class="rank-badge">🥈</span> ${index + 1}</td>
                <td><span class="player-name">💎 ${entry.name}</span></td>
                <td><span class="high-score-value">${entry.score}</span></td>
                <td><span class="fire-emoji">🔥</span> ${entry.streak}</td>
                <td>${formatDate(entry.date)}</td>
            `;
        } else if (index === 2) {
            row.className = 'third-place';
            row.innerHTML = `
                <td><span class="rank-badge">🥉</span> ${index + 1}</td>
                <td><span class="player-name">⭐ ${entry.name}</span></td>
                <td><span class="high-score-value">${entry.score}</span></td>
                <td><span class="fire-emoji">🔥</span> ${entry.streak}</td>
                <td>${formatDate(entry.date)}</td>
            `;
        } else {
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
                <td>${entry.streak}</td>
                <td>${formatDate(entry.date)}</td>
            `;
        }
        
        leaderboardBody.appendChild(row);
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Set up event listeners
function setupEventListeners() {
    headsBtn.addEventListener('click', () => {
        if (isFlipping) return;
        selectPrediction('heads');
    });
    
    tailsBtn.addEventListener('click', () => {
        if (isFlipping) return;
        selectPrediction('tails');
    });
    
    flipBtn.addEventListener('click', () => {
        if (isFlipping || selectedPrediction === null) {
            if (selectedPrediction === null) {
                lastResultMessage = "🎰 SELECT HEADS OR TAILS FIRST! 🎰";
                updateLastResult();
            }
            return;
        }
        flipCoin();
    });
    
    addScoreBtn.addEventListener('click', () => {
        if (currentScore === 0) {
            lastResultMessage = "🎰 SCORE SOME POINTS FIRST! 🎰";
            updateLastResult();
            return;
        }
        showPlayerModal();
    });
    
    saveScoreBtn.addEventListener('click', saveScoreToFirebase);
    modalCloseBtn.addEventListener('click', hidePlayerModal);
    
    playerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveScoreToFirebase();
        }
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (document.activeElement === playerNameInput) {
            if (e.key === 'Escape') {
                hidePlayerModal();
            }
            return;
        }
        
        if (isFlipping) return;
        
        switch(e.key.toLowerCase()) {
            case 'h':
                selectPrediction('heads');
                headsBtn.focus();
                break;
            case 't':
                selectPrediction('tails');
                tailsBtn.focus();
                break;
            case 'f':
                if (selectedPrediction !== null) {
                    flipCoin();
                    flipBtn.focus();
                } else {
                    lastResultMessage = "🎰 SELECT HEADS (H) OR TAILS (T) FIRST! 🎰";
                    updateLastResult();
                }
                break;
            case 'a':
            case 'enter':
                if (currentScore > 0) {
                    showPlayerModal();
                }
                break;
            case 'escape':
                if (playerModal.style.display === 'flex') {
                    hidePlayerModal();
                }
                break;
        }
    });
}

// Select prediction with retro styling
function selectPrediction(prediction) {
    selectedPrediction = prediction;
    
    if (prediction === 'heads') {
        headsBtn.style.transform = 'scale(1.05)';
        headsBtn.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        headsBtn.style.filter = 'brightness(1.2)';
        tailsBtn.style.transform = 'scale(1)';
        tailsBtn.style.boxShadow = '';
        tailsBtn.style.filter = 'brightness(1)';
        lastResultMessage = "🎰 HEADS SELECTED! READY TO FLIP! 🎰";
    } else {
        tailsBtn.style.transform = 'scale(1.05)';
        tailsBtn.style.boxShadow = '0 0 30px rgba(192, 192, 192, 0.8)';
        tailsBtn.style.filter = 'brightness(1.2)';
        headsBtn.style.transform = 'scale(1)';
        headsBtn.style.boxShadow = '';
        headsBtn.style.filter = 'brightness(1)';
        lastResultMessage = "🎰 TAILS SELECTED! READY TO FLIP! 🎰";
    }
    
    updateLastResult();
}

// Flip the coin with casino effects
function flipCoin() {
    isFlipping = true;
    
    flipBtn.disabled = true;
    headsBtn.disabled = true;
    tailsBtn.disabled = true;
    addScoreBtn.disabled = true;
    
    // Play sound effect (simulated)
    playFlipSound();
    
    lastCoinResult = Math.random() < 0.5 ? 'heads' : 'tails';
    
    coin.classList.add('flipping');
    
    const isCorrect = lastCoinResult === selectedPrediction;
    
    setTimeout(() => {
        coin.classList.remove('flipping');
        
        showCoinResult(lastCoinResult);
        
        if (isCorrect) {
            currentStreak++;
            const pointsEarned = 10 * currentStreak;
            currentScore += pointsEarned;
            
            // Show streak multiplier effect
            if (currentStreak > 1) {
                lastResultMessage = `🎰 WINNER! STREAK ${currentStreak} → +${pointsEarned} POINTS! 🎰`;
                showStreakEffect(currentStreak);
            } else {
                lastResultMessage = `🎰 WINNER! +${pointsEarned} POINTS! 🎰`;
            }
            
            showResultMessage('🎰 WINNER! 🎰', 'success');
            playWinSound();
        } else {
            if (currentStreak > 0) {
                lastResultMessage = `🎰 STREAK ENDED AT ${currentStreak}! 🎰`;
            } else {
                lastResultMessage = "🎰 BETTER LUCK NEXT TIME! 🎰";
            }
            currentStreak = 0;
            currentScore = 0;
            showResultMessage('🎰 TRY AGAIN! 🎰', 'error');
            playLoseSound();
        }
        
        if (currentScore > highScore) {
            highScore = currentScore;
            if (isCorrect) {
                lastResultMessage += " 🏆 NEW HIGH SCORE! 🏆";
            }
        }
        
        if (currentStreak > recordStreak) {
            recordStreak = currentStreak;
        }
        
        updateScoreDisplay();
        updateLastResult();
        saveData();
        
        flipBtn.disabled = false;
        headsBtn.disabled = false;
        tailsBtn.disabled = false;
        addScoreBtn.disabled = false;
        isFlipping = false;
        
        if (!isCorrect) {
            selectedPrediction = null;
            headsBtn.style.transform = 'scale(1)';
            headsBtn.style.boxShadow = '';
            headsBtn.style.filter = 'brightness(1)';
            tailsBtn.style.transform = 'scale(1)';
            tailsBtn.style.boxShadow = '';
            tailsBtn.style.filter = 'brightness(1)';
        }
    }, 1000);
}

// Show coin result
function showCoinResult(result) {
    if (result === 'heads') {
        coin.style.transform = 'rotateY(0deg)';
        coinContainer.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.8)';
    } else {
        coin.style.transform = 'rotateY(180deg)';
        coinContainer.style.boxShadow = '0 0 40px rgba(192, 192, 192, 0.8)';
    }
    
    setTimeout(() => {
        coinContainer.style.boxShadow = 'none';
    }, 1500);
}

// Show streak effect
function showStreakEffect(streak) {
    const effect = document.createElement('div');
    effect.className = 'streak-effect';
    effect.textContent = `STREAK x${streak}!`;
    effect.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Orbitron', monospace;
        font-size: 3rem;
        font-weight: 900;
        color: #ff0000;
        text-shadow: 0 0 20px #ff0000;
        z-index: 1500;
        animation: streakPop 1s ease-out forwards;
    `;
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 1000);
}

// Show result message
function showResultMessage(message, type) {
    const existingMessage = document.querySelector('.result-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `result-message ${type}`;
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        top: 120px;
        left: 50%;
        transform: translateX(-50%);
        padding: 20px 40px;
        border-radius: 15px;
        font-family: 'Orbitron', monospace;
        font-weight: 900;
        font-size: 1.5rem;
        z-index: 100;
        opacity: 0;
        transition: opacity 0.3s, transform 0.3s;
        background: ${type === 'success' 
            ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.9), rgba(0, 128, 0, 0.9))' 
            : 'linear-gradient(135deg, rgba(255, 0, 0, 0.9), rgba(128, 0, 0, 0.9))'};
        color: white;
        border: 3px solid ${type === 'success' ? '#00ff00' : '#ff0000'};
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        text-shadow: 0 0 10px white;
        letter-spacing: 1px;
    `;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateX(-50%) translateY(10px)';
    }, 10);
    
    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateX(-50%) translateY(-10px)';
        
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 2500);
}

// Show player name modal
function showPlayerModal() {
    finalScoreDisplay.textContent = currentScore.toString().padStart(4, '0');
    playerNameInput.value = '';
    playerModal.style.display = 'flex';
    playerNameInput.focus();
}

// Hide player name modal
function hidePlayerModal() {
    playerModal.style.display = 'none';
    if (selectedPrediction === 'heads') {
        headsBtn.focus();
    } else if (selectedPrediction === 'tails') {
        tailsBtn.focus();
    } else {
        flipBtn.focus();
    }
}

// Save score to Firebase
function saveScoreToFirebase() {
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        lastResultMessage = "🎰 ENTER A CASINO ALIAS! 🎰";
        updateLastResult();
        return;
    }
    
    if (playerName.length > 20) {
        lastResultMessage = "🎰 NAME TOO LONG! (MAX 20) 🎰";
        updateLastResult();
        return;
    }
    
    const newScore = {
        name: playerName.toUpperCase(),
        score: currentScore,
        streak: currentStreak,
        date: new Date().toISOString()
    };
    
    push(scoresRef, newScore)
        .then(() => {
            hidePlayerModal();
            lastResultMessage = `🎰 ${playerName.toUpperCase()} ENTERED THE CASINO HALL OF FAME! 🎰`;
            updateLastResult();
            showResultMessage('🎰 SCORE SAVED! 🎰', 'success');
            
            // Reset game after saving
            currentScore = 0;
            currentStreak = 0;
            selectedPrediction = null;
            headsBtn.style.transform = 'scale(1)';
            headsBtn.style.boxShadow = '';
            headsBtn.style.filter = 'brightness(1)';
            tailsBtn.style.transform = 'scale(1)';
            tailsBtn.style.boxShadow = '';
            tailsBtn.style.filter = 'brightness(1)';
            coin.style.transform = 'rotateY(0deg)';
            updateScoreDisplay();
            saveData();
        })
        .catch((error) => {
            console.error("Error saving score:", error);
            showResultMessage('🎰 CASINO ERROR! 🎰', 'error');
        });
}

// Sound effects (simulated with console messages)
function playFlipSound() {
    console.log("🎰 CASINO SOUND: Coin flipping... 🎰");
}

function playWinSound() {
    console.log("🎰 CASINO SOUND: Winner! 🎰");
}

function playLoseSound() {
    console.log("🎰 CASINO SOUND: Try again! 🎰");
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);

// Add CSS for streak effect
const style = document.createElement('style');
style.textContent = `
    @keyframes streakPop {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }
    
    .rank-badge {
        font-size: 1.5rem;
        margin-right: 10px;
    }
    
    .player-name {
        font-weight: 700;
        color: #ffd700;
    }
    
    .high-score-value {
        color: #00ff00;
        font-family: 'Orbitron', monospace;
        font-weight: 700;
        text-shadow: 0 0 10px #00ff00;
    }
    
    .fire-emoji {
        font-size: 1.2rem;
        margin-right: 5px;
    }
`;
document.head.appendChild(style);