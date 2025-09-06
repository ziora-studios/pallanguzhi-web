// Pixel Sound System
class PixelSoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.muted = false;
        this.masterVolume = 0.5; // 50% volume reduction
        this.initAudio();
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    }

    // Resume audio context (required for user interaction)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Generate retro beep sound
    playBeep(frequency = 440, duration = 0.1, type = 'square', volume = 0.3) {
        if (!this.enabled || !this.audioContext || this.muted) return;
        
        this.resume();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        const finalVolume = volume * this.masterVolume;
        gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Button click sound
    playClick() {
        this.playBeep(800, 0.05, 'square');
    }

    // Dot pickup sound
    playPickup() {
        this.playBeep(600, 0.08, 'triangle');
    }

    // Dot drop sound - softer, shorter pixel sound
    playDrop() {
        this.playBeep(350, 0.02, 'triangle', 0.08);
    }

    // Capture sound
    playCapture() {
        this.playBeep(1000, 0.15, 'square');
        setTimeout(() => this.playBeep(1200, 0.1, 'square'), 80);
    }

    // Turn change sound
    playTurnChange() {
        this.playBeep(500, 0.1, 'triangle');
        setTimeout(() => this.playBeep(700, 0.1, 'triangle'), 100);
    }

    // Game over sound
    playGameOver() {
        this.playBeep(300, 0.2, 'square');
        setTimeout(() => this.playBeep(250, 0.2, 'square'), 150);
        setTimeout(() => this.playBeep(200, 0.3, 'square'), 300);
    }

    // Victory sound
    playVictory() {
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((note, i) => {
            setTimeout(() => this.playBeep(note, 0.2, 'triangle'), i * 150);
        });
    }

    // Error sound
    playError() {
        this.playBeep(200, 0.3, 'sawtooth');
    }

    // Hover sound - soft blip
    playHover() {
        this.playBeep(600, 0.03, 'sine', 0.12);
    }

    // Turn end sound - when landing in empty pit ends turn
    playTurnEnd() {
        this.playBeep(350, 0.15, 'triangle', 0.12);
    }
}

class PallanguzhiGame {
    constructor() {
        this.board = Array(14).fill(5); // 14 pits, 5 counters each
        this.currentPlayer = 1;
        this.player1Score = 0;
        this.player2Score = 0;
        this.gameOver = false;
        this.isAnimating = false;
        this.gameMode = null; // 'pvp' or 'cpu'
        this.cpuDifficulty = null; // 'easy', 'medium', 'hard', 'expert'
        this.soundSystem = new PixelSoundSystem();
        
        // Stage system properties
        this.currentStage = 1;
        this.stageScores = { player1: 0, player2: 0 }; // Cumulative scores across stages
        this.disabledPits = new Set(); // Pits that are blacked out
        this.lastStageWinner = null; // Track who won the last stage for turn order
        this.cpuMovePending = false; // Prevent multiple simultaneous CPU moves

        this.initializeTitleCard();
    }

    initializeTitleCard() {
        const playButton = document.getElementById('retro-play-btn');
        
        // Add hover sound
        playButton.addEventListener('mouseenter', () => {
            this.soundSystem.playHover();
        });
        
        playButton.addEventListener('click', () => {
            this.soundSystem.playClick();
            this.startGame();
        });
    }

    startGame() {
        const titleCardPopup = document.getElementById('title-card-popup');
        
        // Hide title card and show game mode selection
        titleCardPopup.style.display = 'none';
        this.showGameModeSelection();
    }

    showGameModeSelection() {
        const popup = document.getElementById('game-mode-popup');
        const modeSelection = document.querySelector('.mode-selection');
        const difficultySelection = document.getElementById('difficulty-selection');
        
        popup.style.display = 'flex';
        modeSelection.style.display = 'flex';
        difficultySelection.style.display = 'none';

        // Add hover sounds to mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.soundSystem.playHover();
            });
        });

        // PvP button
        document.getElementById('pvp-btn').onclick = () => {
            this.soundSystem.playClick();
            this.gameMode = 'pvp';
            popup.style.display = 'none';
            this.initializeGame();
            this.updatePlayerLabels();
        };

        // CPU button
        document.getElementById('cpu-btn').onclick = () => {
            this.soundSystem.playClick();
            modeSelection.style.display = 'none';
            difficultySelection.style.display = 'block';
        };

        // Add hover sounds to difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.soundSystem.playHover();
            });
        });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.onclick = () => {
                this.soundSystem.playClick();
                this.gameMode = 'cpu';
                this.cpuDifficulty = btn.dataset.difficulty;
                popup.style.display = 'none';
                this.initializeGame();
                this.updatePlayerLabels();
            };
        });

        // Back button
        document.getElementById('back-to-mode').onclick = () => {
            this.soundSystem.playClick();
            modeSelection.style.display = 'flex';
            difficultySelection.style.display = 'none';
        };
    }

    updatePlayerLabels() {
        if (this.gameMode === 'cpu') {
            document.querySelector('.player2-card h3').textContent = `CPU (${this.cpuDifficulty.toUpperCase()})`;
            document.querySelector('.player2-side').setAttribute('data-label', `CPU (${this.cpuDifficulty.toUpperCase()})`);
        } else {
            // Reset to Player 2 for PvP mode
            document.querySelector('.player2-card h3').textContent = 'Player 2';
            document.querySelector('.player2-side').setAttribute('data-label', 'PLAYER 2');
        }
    }

    // Get the next pit in counter-clockwise direction
    getNextPit(currentPit) {
        // Counter-clockwise flow: 0→1→2→3→4→5→6→7→8→9→10→11→12→13→0
        let nextPit = (currentPit + 1) % 14;
        
        // Skip disabled pits
        while (this.disabledPits.has(nextPit)) {
            nextPit = (nextPit + 1) % 14;
            // Prevent infinite loop if all pits are disabled
            if (nextPit === currentPit) break;
        }
        
        return nextPit;
    }

    initializeGame() {
        // Game state should already be reset by goHome(), just ensure fresh start
        this.board = Array(14).fill(5);
        this.currentPlayer = 1;
        this.player1Score = 0;
        this.player2Score = 0;
        this.gameOver = false;
        this.isAnimating = false;
        this.cpuMovePending = false;
        this.currentStage = 1;
        this.stageScores = { player1: 0, player2: 0 };
        this.disabledPits.clear();
        this.lastStageWinner = null;
        
        this.updateDisplay();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const pits = document.querySelectorAll('.pit');
        pits.forEach(pit => {
            pit.addEventListener('click', (e) => this.handlePitClick(e));
            pit.addEventListener('mouseenter', (e) => {
                this.showTooltip(e);
                if (this.canPlayPit(parseInt(pit.dataset.pit))) {
                    this.soundSystem.playHover();
                }
            });
            pit.addEventListener('mouseleave', (e) => this.hideTooltip(e));
        });

        // Add hover sounds to control buttons
        document.querySelectorAll('#home-btn, #rules-btn, #about-btn, #sound-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.soundSystem.playHover();
            });
        });

        document.getElementById('home-btn').addEventListener('click', () => {
            this.soundSystem.playClick();
            this.goHome();
        });

        document.getElementById('rules-btn').addEventListener('click', () => {
            this.soundSystem.playClick();
            this.showRules();
        });
        document.getElementById('about-btn').addEventListener('click', () => {
            this.soundSystem.playClick();
            this.showAbout();
        });
        document.getElementById('sound-btn').addEventListener('click', () => {
            this.toggleSound();
        });
        // Add hover sounds to close buttons
        document.querySelectorAll('#close-rules, #close-about').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.soundSystem.playHover();
            });
        });

        document.getElementById('close-rules').addEventListener('click', () => {
            this.soundSystem.playClick();
            this.hideRules();
        });
        document.getElementById('close-about').addEventListener('click', () => {
            this.soundSystem.playClick();
            this.hideAbout();
        });
    }

    handlePitClick(event) {
        if (this.gameOver || this.isAnimating) return;

        const pitElement = event.currentTarget;
        const pitIndex = parseInt(pitElement.dataset.pit);
        const pitPlayer = parseInt(pitElement.dataset.player);

        // Check if pit is disabled (blacked out)
        if (this.disabledPits.has(pitIndex)) {
            this.soundSystem.playError();
            return;
        }

        // Check if it's the current player's turn and pit belongs to them
        if (pitPlayer !== this.currentPlayer) return;

        // Check if pit has counters
        if (this.board[pitIndex] === 0) {
            this.soundSystem.playError();
            return;
        }

        this.soundSystem.playPickup();
        this.makeMove(pitIndex);
    }

    canPlayPit(pitIndex) {
        if (this.gameOver || this.isAnimating) return false;
        if (this.disabledPits.has(pitIndex)) return false;
        if (this.board[pitIndex] === 0) return false;
        
        const pitElement = document.querySelector(`[data-pit="${pitIndex}"]`);
        const pitPlayer = parseInt(pitElement.dataset.player);
        const isCpuTurn = this.gameMode === 'cpu' && this.currentPlayer === 2;
        
        return pitPlayer === this.currentPlayer && !isCpuTurn;
    }

    async makeMove(pitIndex) {
        this.isAnimating = true;

        let currentPit = pitIndex;
        let continueTurn = true;

        // Continue distributing until landing in empty pit or hitting two consecutive empty pits
        while (continueTurn) {
            // Check for two consecutive empty pits before picking up
            if (this.board[currentPit] === 0) {
                const nextPit = this.getNextPit(currentPit);
                if (this.board[nextPit] === 0) {
                    // Two consecutive empty pits found, end turn
                    break;
                }
            }

            let counters = this.board[currentPit];
            this.board[currentPit] = 0;

            // Update display to show empty pit
            this.updatePitDisplay(currentPit);

            // If no counters to distribute, break
            if (counters === 0) break;

            // Animate group distribution counter-clockwise
            await this.animateGroupDistribution(currentPit, counters);

            // Board state is already updated during animation
            // Just update currentPit to the final position
            for (let i = 0; i < counters; i++) {
                currentPit = this.getNextPit(currentPit);
            }

            // Check continuation conditions BEFORE captures
            continueTurn = this.shouldContinueTurn(currentPit);
            console.log(`Turn continuation check: currentPit=${currentPit}, continueTurn=${continueTurn}, currentPlayer=${this.currentPlayer}`);

            if (!continueTurn) {
                // Turn ended due to empty pit - animate the empty pit that caused turn end
                const nextPit = this.getNextPit(currentPit);
                if (this.board[nextPit] === 0) {
                    await this.animateTurnEnd(nextPit);
                }
            }

            // Check for captures based on where the last counter landed
            await this.checkCaptures(currentPit);

            if (continueTurn) {
                // Continue from the NEXT pit (not where we landed)
                currentPit = this.getNextPit(currentPit);

                // Brief pause before continuing
                await this.delay(100);
            }
        }

        // Highlight the final pit where the turn ended (only if no turn end animation was played)
        const nextPit = this.getNextPit(currentPit);
        if (this.board[nextPit] !== 0) {
            this.highlightPit(currentPit);
            await this.delay(200);
        }

        this.isAnimating = false;

        // Check if game is over
        if (this.isGameOver()) {
            this.endGame();
        } else {
            // Switch players
            const previousPlayer = this.currentPlayer;
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            console.log(`Player switched from ${previousPlayer} to ${this.currentPlayer}`);
            this.soundSystem.playTurnChange();
        }

        this.updateDisplay();

        // Check for game over at the start of next player's turn
        if (!this.gameOver && this.isGameOver()) {
            this.endGame();
        }

        // If it's CPU's turn, make CPU move after a delay
        if (!this.gameOver && this.gameMode === 'cpu' && this.currentPlayer === 2) {
            console.log('Scheduling CPU move in 1 second...');
            setTimeout(() => {
                this.makeCpuMove();
            }, 1000); // 1 second delay for CPU move
        }
    }

    shouldContinueTurn(lastPit) {
        // Check if the NEXT pit (where we would pick up from) has dots
        const nextPit = this.getNextPit(lastPit);
        if (this.board[nextPit] === 0) {
            return false; // Next pit is empty, turn ends
        }

        // If next pit has dots, we can continue from there
        return true; // Continue the turn from the next pit
    }

    async checkCaptures(lastPit) {
        let captureOccurred = false;

        // Rule 1: Empty Pit Capture
        // If the next pit after where the last counter landed is empty, 
        // capture from the pit after the empty pit
        const nextPit = this.getNextPit(lastPit);
        if (this.board[nextPit] === 0) {
            const pitAfterEmpty = this.getNextPit(nextPit);
            if (this.board[pitAfterEmpty] > 0) {
                const capturedCounters = this.board[pitAfterEmpty];
                this.board[pitAfterEmpty] = 0;

                // Animate capture
                this.soundSystem.playCapture();
                await this.animateCapture(pitAfterEmpty, capturedCounters);

                if (this.currentPlayer === 1) {
                    this.player1Score += capturedCounters;
                } else {
                    this.player2Score += capturedCounters;
                }
                captureOccurred = true;
            }
        }

        // Special rule: If next two pits are empty, turn ends with no capture
        const nextPit1 = this.getNextPit(lastPit);
        const nextPit2 = this.getNextPit(nextPit1);
        if (this.board[nextPit1] === 0 && this.board[nextPit2] === 0) {
            // Turn ends immediately, no additional captures
            return;
        }

        if (captureOccurred) {
            await this.delay(500); // Pause to show capture
        }
    }

    isGameOver() {
        const totalDotsRemaining = this.board.reduce((sum, pit) => sum + pit, 0);
        console.log('isGameOver called - totalDotsRemaining:', totalDotsRemaining);

        // Stage ends when only 1 dot remains
        if (totalDotsRemaining <= 1) {
            console.log('Stage Complete: Only 1 or 0 dots remaining');
            return true;
        }

        // Stage ends if current player has no dots on their side
        if (this.hasNoDotsOnSide(this.currentPlayer)) {
            console.log(`Stage Complete: Player ${this.currentPlayer} has no dots on their side`);
            return true;
        }

        // Stage ends if current player has all pits blocked (empty or disabled)
        if (this.hasAllPitsBlockedOnSide(this.currentPlayer)) {
            console.log(`Stage Complete: Player ${this.currentPlayer} has all pits blocked`);
            return true;
        }

        // Early stage end condition: 2 or fewer dots left with more than 3 empty pits difference
        if (totalDotsRemaining <= 2) {
            const player1EmptyPits = this.countEmptyPits(1);
            const player2EmptyPits = this.countEmptyPits(2);
            const emptyPitDifference = Math.abs(player1EmptyPits - player2EmptyPits);

            console.log('Checking early stage end:', {
                totalDotsRemaining,
                player1EmptyPits,
                player2EmptyPits,
                emptyPitDifference,
                shouldEndStage: emptyPitDifference > 3
            });

            if (emptyPitDifference > 3) {
                console.log('Stage Complete: Early end condition met (2 dots + 3+ empty pit difference)');
                return true;
            }
        }

        return false;
    }

    hasNoDotsOnSide(player) {
        const startPit = player === 1 ? 0 : 7;
        const endPit = player === 1 ? 6 : 13;

        for (let i = startPit; i <= endPit; i++) {
            if (this.board[i] > 0) {
                return false; // Found at least one dot
            }
        }

        return true; // No dots found on this player's side
    }

    hasAllPitsBlockedOnSide(player) {
        const startPit = player === 1 ? 0 : 7;
        const endPit = player === 1 ? 6 : 13;

        for (let i = startPit; i <= endPit; i++) {
            // If pit has dots and is not disabled, player can still play
            if (this.board[i] > 0 && !this.disabledPits.has(i)) {
                return false;
            }
        }

        return true; // All pits are either empty or disabled
    }

    countEmptyPits(player) {
        let emptyCount = 0;
        const startPit = player === 1 ? 0 : 7;
        const endPit = player === 1 ? 6 : 13;

        for (let i = startPit; i <= endPit; i++) {
            if (this.board[i] === 0) {
                emptyCount++;
            }
        }

        return emptyCount;
    }

    endGame() {
        this.gameOver = true;

        // Handle remaining counters based on end condition
        const remainingCounters = this.board.reduce((sum, pit) => sum + pit, 0);

        if (remainingCounters > 0) {
            // If a player has no dots on their side, opponent gets all remaining dots
            if (this.hasNoDotsOnSide(this.currentPlayer)) {
                const opponent = this.currentPlayer === 1 ? 2 : 1;
                if (opponent === 1) {
                    this.player1Score += remainingCounters;
                } else {
                    this.player2Score += remainingCounters;
                }
                console.log(`Player ${opponent} gets ${remainingCounters} remaining dots`);
            } else {
                // For other end conditions, current player gets remaining dots
                if (this.currentPlayer === 1) {
                    this.player1Score += remainingCounters;
                } else {
                    this.player2Score += remainingCounters;
                }
                console.log(`Player ${this.currentPlayer} gets ${remainingCounters} remaining dots`);
            }

            // Clear the board
            this.board.fill(0);
        }

        this.showWinner();
    }

    showWinner() {
        let winner;
        let winnerMessage = "";
        
        // Check if this is a true game over (player has no dots for next stage) or just stage completion
        const isGameOverByNoDots = this.player1Score === 0 || this.player2Score === 0;
        
        // Debug logging
        console.log('showWinner called:', {
            currentStage: this.currentStage,
            isGameOverByNoDots,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            disabledPits: Array.from(this.disabledPits),
            board: this.board
        });

        // Determine winner text based on game mode and track winner for next stage
        if (this.player1Score > this.player2Score) {
            winner = "Player 1 Wins!";
            this.lastStageWinner = 1;
            this.soundSystem.playVictory();
        } else if (this.player2Score > this.player1Score) {
            this.lastStageWinner = 2;
            if (this.gameMode === 'cpu') {
                winner = `CPU Wins! (${this.cpuDifficulty.toUpperCase()})`;
                this.soundSystem.playGameOver();
            } else {
                winner = "Player 2 Wins!";
                this.soundSystem.playVictory();
            }
        } else {
            winner = "It's a Tie!";
            this.lastStageWinner = null; // No winner in case of tie
            this.soundSystem.playGameOver();
        }

        // If game over by no dots, show game over popup instead of stage completion
        if (isGameOverByNoDots) {
            this.showGameOverPopup(winner, winnerMessage);
            return;
        }

        // Check if it was an early game over
        const totalDotsRemaining = this.board.reduce((sum, pit) => sum + pit, 0);
        if (totalDotsRemaining > 0) {
            winnerMessage = " (Early Game Over)";
        }

        // Create winner overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const winnerDiv = document.createElement('div');
        winnerDiv.className = 'winner-message';

        const title = document.createElement('h2');
        title.textContent = `Stage ${this.currentStage} Complete!`;

        const winnerText = document.createElement('h3');
        winnerText.textContent = winner + winnerMessage;
        
        // Add next stage turn info
        const nextTurnInfo = document.createElement('p');
        if (this.lastStageWinner === 1) {
            nextTurnInfo.textContent = "Player 1 goes first in the next stage!";
        } else if (this.lastStageWinner === 2) {
            if (this.gameMode === 'cpu') {
                nextTurnInfo.textContent = "CPU goes first in the next stage!";
            } else {
                nextTurnInfo.textContent = "Player 2 goes first in the next stage!";
            }
        } else {
            nextTurnInfo.textContent = "Player 1 goes first in the next stage (tie)";
        }
        nextTurnInfo.style.color = '#000000';
        nextTurnInfo.style.fontWeight = 'bold';
        nextTurnInfo.style.marginTop = '10px';

        const score1 = document.createElement('p');
        score1.textContent = `Player 1: ${this.player1Score} counters`;

        const score2 = document.createElement('p');
        if (this.gameMode === 'cpu') {
            score2.textContent = `CPU: ${this.player2Score} counters`;
        } else {
            score2.textContent = `Player 2: ${this.player2Score} counters`;
        }

        // Show cumulative scores
        const totalScore1 = document.createElement('p');
        totalScore1.textContent = `Total P1: ${this.stageScores.player1 + this.player1Score}`;
        totalScore1.style.fontWeight = 'bold';

        const totalScore2 = document.createElement('p');
        if (this.gameMode === 'cpu') {
            totalScore2.textContent = `Total CPU: ${this.stageScores.player2 + this.player2Score}`;
        } else {
            totalScore2.textContent = `Total P2: ${this.stageScores.player2 + this.player2Score}`;
        }
        totalScore2.style.fontWeight = 'bold';

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';

        // Play Again button
        const playAgainBtn = document.createElement('button');
        playAgainBtn.textContent = 'Play Again';
        playAgainBtn.onclick = () => {
            this.resetGame();
            overlay.remove();
            winnerDiv.remove();
        };

        // Next Stage button
        const nextStageBtn = document.createElement('button');
        nextStageBtn.textContent = 'Next Stage';
        nextStageBtn.onclick = () => {
            this.setupNextStage();
            overlay.remove();
            winnerDiv.remove();
        };

        // Home button
        const homeBtn = document.createElement('button');
        homeBtn.textContent = 'Home';
        homeBtn.onclick = () => {
            this.goHome();
            overlay.remove();
            winnerDiv.remove();
        };

        // Add hover sounds to buttons
        [playAgainBtn, nextStageBtn, homeBtn].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.soundSystem.playHover();
            });
            btn.addEventListener('click', () => {
                this.soundSystem.playClick();
            });
        });

        buttonContainer.appendChild(playAgainBtn);
        buttonContainer.appendChild(nextStageBtn);
        buttonContainer.appendChild(homeBtn);

        winnerDiv.appendChild(title);
        winnerDiv.appendChild(winnerText);
        winnerDiv.appendChild(nextTurnInfo);
        winnerDiv.appendChild(score1);
        winnerDiv.appendChild(score2);
        winnerDiv.appendChild(totalScore1);
        winnerDiv.appendChild(totalScore2);
        winnerDiv.appendChild(buttonContainer);

        overlay.appendChild(winnerDiv);
        document.body.appendChild(overlay);

        console.log('Stage Complete:', winner, 'P1:', this.player1Score, 'P2:', this.player2Score);
    }

    showGameOverPopup(winner, winnerMessage) {
        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'winner-message';

        const title = document.createElement('h2');
        title.textContent = 'Game Over!';

        const winnerText = document.createElement('h3');
        winnerText.textContent = winner + winnerMessage;

        const score1 = document.createElement('p');
        score1.textContent = `Player 1: ${this.player1Score} counters`;

        const score2 = document.createElement('p');
        if (this.gameMode === 'cpu') {
            score2.textContent = `CPU: ${this.player2Score} counters`;
        } else {
            score2.textContent = `Player 2: ${this.player2Score} counters`;
        }

        // Show total scores across all stages
        const totalScore1 = document.createElement('p');
        totalScore1.textContent = `Total P1: ${this.stageScores.player1 + this.player1Score}`;
        totalScore1.style.fontWeight = 'bold';

        const totalScore2 = document.createElement('p');
        if (this.gameMode === 'cpu') {
            totalScore2.textContent = `Total CPU: ${this.stageScores.player2 + this.player2Score}`;
        } else {
            totalScore2.textContent = `Total P2: ${this.stageScores.player2 + this.player2Score}`;
        }
        totalScore2.style.fontWeight = 'bold';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.marginTop = '20px';

        // Home button only
        const homeBtn = document.createElement('button');
        homeBtn.textContent = 'Home';
        homeBtn.onclick = () => {
            this.soundSystem.playClick();
            this.goHome();
            overlay.remove();
        };

        buttonContainer.appendChild(homeBtn);

        gameOverDiv.appendChild(title);
        gameOverDiv.appendChild(winnerText);
        gameOverDiv.appendChild(score1);
        gameOverDiv.appendChild(score2);
        gameOverDiv.appendChild(totalScore1);
        gameOverDiv.appendChild(totalScore2);
        gameOverDiv.appendChild(buttonContainer);

        // Add hover effects to button
        homeBtn.addEventListener('mouseenter', () => {
            this.soundSystem.playHover();
        });

        overlay.appendChild(gameOverDiv);
        document.body.appendChild(overlay);

        console.log('Game Over:', winner, 'P1:', this.player1Score, 'P2:', this.player2Score);
    }

    updateDisplay() {
        // Update all pit displays
        const pits = document.querySelectorAll('.pit');
        pits.forEach((pit) => {
            const pitIndex = parseInt(pit.dataset.pit);
            this.updatePitDisplay(pitIndex);

            // Handle disabled pits (blacked out)
            if (this.disabledPits.has(pitIndex)) {
                pit.classList.add('blacked-out');
                pit.classList.add('disabled');
            } else {
                pit.classList.remove('blacked-out');
                
                // Disable pits that don't belong to current player or are empty
                const pitPlayer = parseInt(pit.dataset.player);
                const isCpuTurn = this.gameMode === 'cpu' && this.currentPlayer === 2;
                
                if (pitPlayer !== this.currentPlayer || this.board[pitIndex] === 0 || this.gameOver || this.isAnimating || isCpuTurn) {
                    pit.classList.add('disabled');
                } else {
                    pit.classList.remove('disabled');
                }
            }
        });

        // Update current player display
        let currentPlayerText = 'Game Over';
        if (!this.gameOver) {
            if (this.gameMode === 'cpu' && this.currentPlayer === 2) {
                currentPlayerText = `Stage ${this.currentStage} - CPU's Turn (${this.cpuDifficulty.toUpperCase()})`;
            } else {
                currentPlayerText = `Stage ${this.currentStage} - Player ${this.currentPlayer}'s Turn`;
            }
        }
        document.getElementById('current-player').textContent = currentPlayerText;

        // Update scores
        document.getElementById('player1-score').textContent = this.player1Score;
        document.getElementById('player2-score').textContent = this.player2Score;

        // Update winning probability bar
        this.updateWinningProbability();

        // Update player dots
        this.updatePlayerDots();

        // Update player card active states
        const player1Card = document.getElementById('player1-card');
        const player2Card = document.getElementById('player2-card');

        // Update board side highlighting
        const player1Side = document.querySelector('.player1-side');
        const player2Side = document.querySelector('.player2-side');

        if (this.gameOver) {
            player1Card.classList.remove('active');
            player2Card.classList.remove('active');
            player1Side.classList.remove('current-player');
            player2Side.classList.remove('current-player');
        } else {
            if (this.currentPlayer === 1) {
                player1Card.classList.add('active');
                player2Card.classList.remove('active');
                player1Side.classList.add('current-player');
                player2Side.classList.remove('current-player');
            } else {
                player1Card.classList.remove('active');
                player2Card.classList.add('active');
                player1Side.classList.remove('current-player');
                player2Side.classList.add('current-player');
            }
        }
    }

    updatePitDisplay(pitIndex) {
        const pit = document.querySelector(`[data-pit="${pitIndex}"]`);
        const dotsContainer = pit.querySelector('.dots-container');
        const count = this.board[pitIndex];

        // Clear existing dots
        dotsContainer.innerHTML = '';

        // Create dots based on count
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dotsContainer.appendChild(dot);
        }

        // Update tooltip if it exists
        this.updateTooltip(pitIndex);
    }

    showTooltip(event) {
        const pit = event.currentTarget;
        const pitIndex = parseInt(pit.dataset.pit);
        const pitPlayer = parseInt(pit.dataset.player);
        const count = this.board[pitIndex];

        // Remove existing tooltip
        const existingTooltip = pit.querySelector('.pit-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        // Create new tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'pit-tooltip';
        tooltip.textContent = count === 1 ? '1 DOT' : `${count} DOTS`;
        pit.appendChild(tooltip);

        // Show turn helper only for current player's pits with counters
        if (!this.gameOver && !this.isAnimating &&
            pitPlayer === this.currentPlayer && count > 0) {
            this.showTurnHelper(pitIndex);
        }
    }

    hideTooltip(event) {
        const pit = event.currentTarget;
        const tooltip = pit.querySelector('.pit-tooltip');
        if (tooltip) {
            tooltip.remove();
        }

        // Hide turn helper
        this.hideTurnHelper();
    }

    showTurnHelper(startPitIndex) {
        // Calculate where the counters will land
        const destinationPit = this.calculateDestination(startPitIndex);

        if (destinationPit !== -1) {
            const destPitElement = document.querySelector(`[data-pit="${destinationPit}"]`);
            if (destPitElement) {
                destPitElement.classList.add('destination-highlight');
            }
        }
    }

    hideTurnHelper() {
        // Remove all destination highlights
        const highlightedPits = document.querySelectorAll('.destination-highlight');
        highlightedPits.forEach(pit => {
            pit.classList.remove('destination-highlight');
        });
    }

    calculateDestination(startPitIndex) {
        const counters = this.board[startPitIndex];
        if (counters === 0) return -1;

        let currentPit = startPitIndex;

        // Distribute counters counter-clockwise
        for (let i = 0; i < counters; i++) {
            currentPit = this.getNextPit(currentPit);
        }

        return currentPit;
    }

    updateTooltip(pitIndex) {
        const pit = document.querySelector(`[data-pit="${pitIndex}"]`);
        const tooltip = pit.querySelector('.pit-tooltip');
        if (tooltip) {
            const count = this.board[pitIndex];
            tooltip.textContent = count === 1 ? '1 DOT' : `${count} DOTS`;
        }
    }

    updatePlayerDots() {
        // Update Player 1 dots
        const player1DotsContainer = document.getElementById('player1-dots');
        player1DotsContainer.innerHTML = '';

        for (let i = 0; i < this.player1Score; i++) {
            const dot = document.createElement('div');
            dot.className = 'player-dot';
            player1DotsContainer.appendChild(dot);
        }

        // Update Player 2 dots
        const player2DotsContainer = document.getElementById('player2-dots');
        player2DotsContainer.innerHTML = '';

        for (let i = 0; i < this.player2Score; i++) {
            const dot = document.createElement('div');
            dot.className = 'player-dot';
            player2DotsContainer.appendChild(dot);
        }
    }

    updateWinningProbability() {
        // Calculate total points (current scores + dots on board + stage scores)
        const totalBoardDots = this.board.reduce((sum, pit) => sum + pit, 0);
        const totalCurrentPoints = this.player1Score + this.player2Score + totalBoardDots;
        const totalStagePoints = this.stageScores.player1 + this.stageScores.player2;
        const grandTotal = totalCurrentPoints + totalStagePoints;

        // Calculate current totals including stage scores
        const p1Total = this.player1Score + this.stageScores.player1;
        const p2Total = this.player2Score + this.stageScores.player2;

        // Calculate probabilities (if no points yet, show 50-50)
        let p1Probability = 50;
        let p2Probability = 50;

        if (grandTotal > 0) {
            p1Probability = Math.round((p1Total / (p1Total + p2Total)) * 100);
            p2Probability = 100 - p1Probability;
        }

        // Update the probability bar
        const p1Fill = document.getElementById('player1-probability');
        const p2Fill = document.getElementById('player2-probability');

        p1Fill.style.width = p1Probability + '%';
        p2Fill.style.width = p2Probability + '%';

        // Update labels with percentages
        document.querySelector('.p1-label').textContent = `P1 ${p1Probability}%`;
        document.querySelector('.p2-label').textContent = `P2 ${p2Probability}%`;
    }

    async animateGroupDistribution(startPit, totalCounters) {
        // Create convoy of dots
        const convoy = [];
        const sourcePit = document.querySelector(`[data-pit="${startPit}"]`);
        const sourceRect = sourcePit.getBoundingClientRect();

        // Create all dots in a tight group formation
        for (let i = 0; i < totalCounters; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot convoy-dot';
            // Position dots in a smaller, tighter cluster
            const offsetX = (i % 3 - 1) * 4; // 3 dots per row, tighter spacing
            const offsetY = Math.floor(i / 3) * 4;
            dot.style.left = (sourceRect.left + sourceRect.width / 2 + offsetX) + 'px';
            dot.style.top = (sourceRect.top + sourceRect.height / 2 + offsetY) + 'px';
            document.body.appendChild(dot);
            convoy.push(dot);
        }

        // Move convoy step by step, dropping one dot at each pit
        let currentPit = startPit;

        for (let step = 0; step < totalCounters; step++) {
            currentPit = this.getNextPit(currentPit);
            const targetPit = document.querySelector(`[data-pit="${currentPit}"]`);
            const targetRect = targetPit.getBoundingClientRect();

            // Move entire remaining convoy to next pit
            await this.moveConvoyToPit(convoy, step, targetRect, startPit, currentPit);

            // Update board state after movement
            this.board[currentPit]++;

            // Drop off one dot at this pit
            if (convoy.length > step) {
                const droppedDot = convoy[step];
                droppedDot.classList.add('dropped');
                this.soundSystem.playDrop();
                setTimeout(() => droppedDot.remove(), 150);
            }

            // Update pit display immediately after board state change
            this.updatePitDisplay(currentPit);

            // Much faster animation - shorter pause between moves
            await this.delay(100);
        }

        // Clean up any remaining dots
        convoy.forEach(dot => {
            if (dot.parentNode) dot.remove();
        });

        // Final update of source pit display
        this.updatePitDisplay(startPit);
    }

    async moveConvoyToPit(convoy, step, targetRect, fromPit, toPit) {
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        // Special handling for corner transitions
        const isCornerTransition = (fromPit === 6 && toPit === 7) || (fromPit === 13 && toPit === 0);

        return new Promise(resolve => {
            convoy.forEach((dot, index) => {
                if (index >= step) { // Only move dots that haven't been dropped yet
                    const offsetX = ((index - step) % 3 - 1) * 4; // Tighter spacing
                    const offsetY = Math.floor((index - step) / 3) * 4;

                    dot.style.transition = 'all 0.1s ease-in-out'; // Faster transition

                    if (isCornerTransition) {
                        // Add slight curve for corner transitions
                        const currentX = parseFloat(dot.style.left);
                        const currentY = parseFloat(dot.style.top);
                        const midX = (currentX + targetX + offsetX) / 2;
                        const midY = Math.min(currentY, targetY + offsetY) - 15;

                        // First move to midpoint
                        dot.style.left = midX + 'px';
                        dot.style.top = midY + 'px';

                        setTimeout(() => {
                            // Then move to final position
                            dot.style.left = (targetX + offsetX) + 'px';
                            dot.style.top = (targetY + offsetY) + 'px';
                        }, 100);
                    } else {
                        // Direct movement
                        dot.style.left = (targetX + offsetX) + 'px';
                        dot.style.top = (targetY + offsetY) + 'px';
                    }
                }
            });

            setTimeout(resolve, 100); // Faster resolution
        });
    }

    async animateCapture(pitIndex, count) {
        console.log(`animateCapture called for pit ${pitIndex} with ${count} dots`);
        const pit = document.querySelector(`[data-pit="${pitIndex}"]`);
        const dots = pit.querySelectorAll('.dot');
        console.log(`Found ${dots.length} dots to animate`);

        // Animate all dots being captured
        dots.forEach((dot, index) => {
            setTimeout(() => {
                console.log(`Adding captured class to dot ${index}`);
                dot.classList.add('captured');
            }, index * 50);
        });

        await this.delay(600);
        this.updatePitDisplay(pitIndex);
    }

    highlightPit(pitIndex) {
        const pit = document.querySelector(`[data-pit="${pitIndex}"]`);
        pit.classList.add('highlight');
        setTimeout(() => {
            pit.classList.remove('highlight');
        }, 500);
    }

    async animateTurnEnd(emptyPitIndex) {
        const pit1 = document.querySelector(`[data-pit="${emptyPitIndex}"]`);
        const nextEmptyPitIndex = this.getNextPit(emptyPitIndex);
        const pit2 = document.querySelector(`[data-pit="${nextEmptyPitIndex}"]`);
        
        // Play turn end sound
        this.soundSystem.playTurnEnd();
        
        // Add turn end animation class to both pits with slight delay
        pit1.classList.add('turn-end');
        setTimeout(() => {
            pit2.classList.add('turn-end');
        }, 100); // Small delay for visual effect
        
        // Wait for animation to complete
        await this.delay(900);
        
        // Remove animation class from both pits
        pit1.classList.remove('turn-end');
        pit2.classList.remove('turn-end');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    resetGame() {
        this.board = Array(14).fill(5);
        // Preserve the correct starting player for this stage (based on who won the previous stage)
        this.currentPlayer = this.lastStageWinner || 1; // Default to Player 1 if no previous winner or first stage
        this.player1Score = 0;
        this.player2Score = 0;
        this.gameOver = false;
        this.isAnimating = false;
        this.cpuMovePending = false;

        // Remove any winner overlays
        const overlays = document.querySelectorAll('.overlay, .winner-message');
        overlays.forEach(overlay => overlay.remove());

        // Remove any moving dots
        const movingDots = document.querySelectorAll('.dot.moving, .dot.moving-group, .dot.convoy-dot');
        movingDots.forEach(dot => dot.remove());

        // Update player labels based on current game mode
        this.updatePlayerLabels();

        this.updateDisplay();
        
        // If it's CPU's turn to start after reset, make CPU move after a delay
        if (this.gameMode === 'cpu' && this.currentPlayer === 2) {
            setTimeout(() => {
                this.makeCpuMove();
            }, 1000); // 1 second delay to let player see the reset
        }
    }

    showRules() {
        const rulesPopup = document.getElementById('rules-popup');
        rulesPopup.style.display = 'flex';
    }

    hideRules() {
        const rulesPopup = document.getElementById('rules-popup');
        rulesPopup.style.display = 'none';
    }

    showAbout() {
        const aboutPopup = document.getElementById('about-popup');
        aboutPopup.style.display = 'flex';
    }

    hideAbout() {
        const aboutPopup = document.getElementById('about-popup');
        aboutPopup.style.display = 'none';
    }

    toggleSound() {
        const isMuted = this.soundSystem.toggleMute();
        const soundBtn = document.getElementById('sound-btn');
        
        if (isMuted) {
            soundBtn.textContent = '🔇';
        } else {
            soundBtn.textContent = '🔊';
            // Play a test sound when unmuting
            this.soundSystem.playClick();
        }
    }

    setupNextStage() {
        this.currentStage++;
        
        // Add current game scores to stage scores
        this.stageScores.player1 += this.player1Score;
        this.stageScores.player2 += this.player2Score;
        
        // Store current scores for distribution
        const p1Dots = this.player1Score;
        const p2Dots = this.player2Score;
        
        // Reset game state
        this.board = Array(14).fill(0);
        this.gameOver = false;
        // Set starting player based on who won the previous stage
        this.currentPlayer = this.lastStageWinner || 1; // Default to Player 1 if tie or first stage
        this.disabledPits.clear();
        
        // Distribute Player 1's dots to Player 1's side (pits 0-6)
        let p1DotsToPlace = Math.min(p1Dots, 35); // Max 35 dots can fit in 7 pits (7 * 5)
        let p1PitIndex = 0;
        
        while (p1DotsToPlace >= 5 && p1PitIndex <= 6) {
            this.board[p1PitIndex] = 5;
            p1DotsToPlace -= 5;
            p1PitIndex++;
        }
        
        // Place remaining P1 dots (less than 5) in next pit
        if (p1DotsToPlace > 0 && p1PitIndex <= 6) {
            this.board[p1PitIndex] = p1DotsToPlace;
            p1PitIndex++;
        }
        
        // Disable remaining P1 pits
        for (let i = p1PitIndex; i <= 6; i++) {
            this.disabledPits.add(i);
        }
        
        // Distribute Player 2's dots to Player 2's side (pits 7-13)
        let p2DotsToPlace = Math.min(p2Dots, 35); // Max 35 dots can fit in 7 pits (7 * 5)
        let p2PitIndex = 7;
        
        while (p2DotsToPlace >= 5 && p2PitIndex <= 13) {
            this.board[p2PitIndex] = 5;
            p2DotsToPlace -= 5;
            p2PitIndex++;
        }
        
        // Place remaining P2 dots (less than 5) in next pit
        if (p2DotsToPlace > 0 && p2PitIndex <= 13) {
            this.board[p2PitIndex] = p2DotsToPlace;
            p2PitIndex++;
        }
        
        // Disable remaining P2 pits
        for (let i = p2PitIndex; i <= 13; i++) {
            this.disabledPits.add(i);
        }
        
        // Set starting scores for next stage (excess dots that couldn't fit in pits)
        this.player1Score = Math.max(0, p1Dots - 35);
        this.player2Score = Math.max(0, p2Dots - 35);
        
        this.updateDisplay();
        
        // If it's CPU's turn to start the new stage, make CPU move after a delay
        if (this.gameMode === 'cpu' && this.currentPlayer === 2) {
            setTimeout(() => {
                this.makeCpuMove();
            }, 1000); // 1 second delay to let player see the new stage setup
        }
    }

    goHome() {
        // FORCE STOP all animations and timers immediately
        this.isAnimating = false;
        this.cpuMovePending = false;
        this.gameOver = true; // Temporarily set to stop any ongoing processes
        
        // Clear all timeouts (this will stop any pending CPU moves or animations)
        // Note: This only runs when Home button is pressed, not during normal gameplay
        for (let i = 1; i < 99999; i++) {
            window.clearTimeout(i);
        }
        
        // Immediately reset everything to initial state
        this.board = Array(14).fill(5);
        this.currentPlayer = 1;
        this.player1Score = 0;
        this.player2Score = 0;
        this.gameOver = false; // Now set back to false for fresh game
        this.isAnimating = false;
        this.cpuMovePending = false;
        this.gameMode = null;
        this.cpuDifficulty = null;
        this.currentStage = 1;
        this.stageScores = { player1: 0, player2: 0 };
        this.disabledPits.clear();
        this.lastStageWinner = null;

        // FORCE REMOVE all visual elements immediately
        const overlays = document.querySelectorAll('.overlay, .winner-message');
        overlays.forEach(overlay => overlay.remove());

        // FORCE REMOVE all moving dots and animations
        const movingDots = document.querySelectorAll('.dot.moving, .dot.moving-group, .dot.convoy-dot, .dot');
        movingDots.forEach(dot => {
            dot.remove();
        });
        
        // FORCE complete visual reset of all pits
        const pits = document.querySelectorAll('.pit');
        pits.forEach(pit => {
            pit.classList.remove('blacked-out', 'disabled', 'highlighted');
            // FORCE clear any existing dots and animations
            const dotsContainer = pit.querySelector('.dots');
            if (dotsContainer) {
                dotsContainer.innerHTML = '';
            }
            // Reset any CSS animations
            pit.style.animation = '';
        });
        
        // Reset player labels to default
        document.querySelector('.player2-card h3').textContent = 'Player 2';
        document.querySelector('.player2-side').setAttribute('data-label', 'PLAYER 2');
        
        // Immediately update display with fresh state
        this.updateDisplay();
        
        // Show title card immediately
        const titleCardPopup = document.getElementById('title-card-popup');
        titleCardPopup.style.display = 'flex';
    }

    // CPU AI Methods
    makeCpuMove() {
        // Extra safety checks to prevent double CPU turns
        if (this.gameOver || this.isAnimating || this.currentPlayer !== 2) {
            return;
        }

        // Prevent multiple simultaneous CPU moves
        if (this.cpuMovePending) {
            return;
        }
        this.cpuMovePending = true;

        const availableMoves = this.getAvailableMoves(2);
        if (availableMoves.length === 0) {
            this.cpuMovePending = false;
            return;
        }

        let selectedMove;
        switch (this.cpuDifficulty) {
            case 'easy':
                selectedMove = this.getRandomMove(availableMoves);
                break;
            case 'medium':
                selectedMove = this.getMediumMove(availableMoves);
                break;
            case 'hard':
                selectedMove = this.getHardMove(availableMoves);
                break;
            case 'expert':
                selectedMove = this.getExpertMove(availableMoves);
                break;
            default:
                selectedMove = this.getRandomMove(availableMoves);
        }

        this.makeMove(selectedMove).then(() => {
            this.cpuMovePending = false;
        });
    }

    getAvailableMoves(player) {
        const moves = [];
        const startPit = player === 1 ? 0 : 7;
        const endPit = player === 1 ? 6 : 13;

        for (let i = startPit; i <= endPit; i++) {
            if (this.board[i] > 0) {
                moves.push(i);
            }
        }
        return moves;
    }

    getRandomMove(availableMoves) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    getMediumMove(availableMoves) {
        // Medium AI: Basic strategic thinking with simple evaluation
        let bestMoves = [];
        let bestScore = -Infinity;

        for (const move of availableMoves) {
            const score = this.mediumEvaluateMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (Math.abs(score - bestScore) < 1) {
                bestMoves.push(move);
            }
        }

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    mediumEvaluateMove(pitIndex) {
        // Simplified but strategic evaluation for Medium AI
        const simulation = this.simulateCompleteMove(pitIndex, 2);
        
        let score = 0;
        
        // 1. Immediate captures (main focus)
        score += simulation.capturedDots * 20;
        
        // 2. Turn continuation (important)
        if (simulation.continuesTurn) {
            score += 15;
        }
        
        // 3. Basic positioning
        const dots = this.board[pitIndex];
        if (dots >= 3 && dots <= 7) {
            score += 5; // Prefer moderate-sized pits
        }
        
        // 4. Simple defensive check
        const opponentThreat = this.findBestOpponentResponse(simulation.finalBoard);
        if (opponentThreat.captureValue > 4) {
            score -= opponentThreat.captureValue * 6;
        }
        
        // 5. Avoid leaving single dots (they're usually bad)
        if (simulation.finalBoard[simulation.finalPit] === 1) {
            score -= 3;
        }
        
        // 6. Basic endgame awareness
        const totalDots = simulation.finalBoard.reduce((sum, pit) => sum + pit, 0);
        if (totalDots <= 15) {
            score += simulation.capturedDots * 10; // Extra value for captures in endgame
        }
        
        return score;
    }

    getHardMove(availableMoves) {
        // Hard AI: Strategic evaluation with good understanding
        let bestMoves = [];
        let bestScore = -Infinity;

        for (const move of availableMoves) {
            const score = this.hardEvaluateMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (Math.abs(score - bestScore) < 0.5) {
                bestMoves.push(move);
            }
        }

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    hardEvaluateMove(pitIndex) {
        const simulation = this.simulateCompleteMove(pitIndex, 2);
        
        let score = 0;
        
        // 1. Immediate captures (high priority)
        score += simulation.capturedDots * 35;
        
        // 2. Turn continuation bonus
        if (simulation.continuesTurn) {
            score += 25;
            // Extra bonus for longer turns
            score += simulation.turnLength * 5;
        }
        
        // 3. Strategic positioning
        score += this.evaluateStrategicPosition(simulation.finalBoard, 2) * 12;
        
        // 4. Defensive considerations
        score -= this.evaluateOpponentThreats(simulation.finalBoard, 1) * 10;
        
        // 5. Board control evaluation
        score += this.evaluateBoardControl(simulation.finalBoard, 2) * 8;
        
        // 6. Endgame awareness
        const totalDots = simulation.finalBoard.reduce((sum, pit) => sum + pit, 0);
        if (totalDots <= 20) {
            score += this.evaluateEndgameHard(simulation.finalBoard, 2) * 15;
        }
        
        // 7. Opening strategy
        if (totalDots > 45) {
            score += this.evaluateOpeningHard(pitIndex) * 6;
        }
        
        // 8. Avoid setting up opponent
        const opponentThreat = this.findBestOpponentResponse(simulation.finalBoard);
        if (opponentThreat.captureValue > 3) {
            score -= opponentThreat.captureValue * 12;
        }
        
        // 9. Mobility consideration
        score += this.evaluateMobility(simulation.finalBoard, 2) * 4;
        
        return score;
    }

    evaluateBoardControl(board, player) {
        let score = 0;
        const ourStart = player === 2 ? 7 : 0;
        const ourEnd = player === 2 ? 13 : 6;
        const oppStart = player === 2 ? 0 : 7;
        const oppEnd = player === 2 ? 6 : 13;
        
        let ourDots = 0, oppDots = 0;
        for (let i = ourStart; i <= ourEnd; i++) ourDots += board[i];
        for (let i = oppStart; i <= oppEnd; i++) oppDots += board[i];
        
        // Prefer having more dots on our side (mobility advantage)
        score += (ourDots - oppDots) * 2;
        
        // Prefer balanced distribution on our side
        const ourPits = [];
        for (let i = ourStart; i <= ourEnd; i++) {
            if (board[i] > 0) ourPits.push(board[i]);
        }
        
        if (ourPits.length > 0) {
            const avg = ourPits.reduce((a, b) => a + b, 0) / ourPits.length;
            const variance = ourPits.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / ourPits.length;
            score -= variance * 0.5; // Prefer more balanced distribution
        }
        
        return score;
    }

    evaluateEndgameHard(board, player) {
        let score = 0;
        const ourStart = player === 2 ? 7 : 0;
        const ourEnd = player === 2 ? 13 : 6;
        const oppStart = player === 2 ? 0 : 7;
        const oppEnd = player === 2 ? 6 : 13;
        
        let ourDots = 0, oppDots = 0;
        for (let i = ourStart; i <= ourEnd; i++) ourDots += board[i];
        for (let i = oppStart; i <= oppEnd; i++) oppDots += board[i];
        
        // In endgame, having more dots is crucial
        score += (ourDots - oppDots) * 8;
        
        // Big bonus for forcing opponent into no-move situation
        if (oppDots === 0) {
            score += 50;
        }
        
        // Prefer moves that can capture multiple dots in endgame
        for (let i = ourStart; i <= ourEnd; i++) {
            if (board[i] > 0) {
                const potentialCapture = this.calculatePotentialCapture(board, i, player);
                score += potentialCapture * 3;
            }
        }
        
        return score;
    }

    evaluateOpeningHard(pitIndex) {
        // Opening strategy for Hard AI
        let score = 0;
        
        // Prefer middle pits (better positioning)
        const middlePits = [9, 10, 11]; // CPU's middle pits
        if (middlePits.includes(pitIndex)) {
            score += 4;
        }
        
        // Avoid edge pits in opening
        const edgePits = [7, 13];
        if (edgePits.includes(pitIndex)) {
            score -= 2;
        }
        
        // Prefer pits with moderate number of dots (3-6)
        const dots = this.board[pitIndex];
        if (dots >= 3 && dots <= 6) {
            score += 2;
        }
        
        return score;
    }

    evaluateMobility(board, player) {
        // Evaluate how many moves the player has
        const moves = this.getAvailableMovesFromBoard(board, player);
        const oppMoves = this.getAvailableMovesFromBoard(board, player === 1 ? 2 : 1);
        
        // Prefer having more move options than opponent
        return (moves.length - oppMoves.length) * 2;
    }

    calculatePotentialCapture(board, pitIndex, player) {
        // Calculate potential dots that could be captured from this pit
        let currentPit = pitIndex;
        const dots = board[pitIndex];
        
        // Simulate where the last dot would land
        for (let i = 0; i < dots; i++) {
            currentPit = this.getNextPitFromBoard(currentPit, board);
        }
        
        // Check for potential capture
        const nextPit = this.getNextPitFromBoard(currentPit, board);
        if (board[nextPit] === 0) {
            const captureFromPit = this.getNextPitFromBoard(nextPit, board);
            return board[captureFromPit];
        }
        
        return 0;
    }

    getExpertMove(availableMoves) {
        // Expert AI: Advanced strategy with deep analysis
        console.log('Expert AI thinking...');
        
        let bestMoves = [];
        let bestScore = -Infinity;

        // Analyze each possible move deeply
        for (const move of availableMoves) {
            const score = this.expertEvaluateMove(move);
            console.log(`Move ${move}: Score ${score}`);
            
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (Math.abs(score - bestScore) < 0.1) {
                bestMoves.push(move);
            }
        }

        console.log(`Best moves: ${bestMoves}, Best score: ${bestScore}`);
        
        // Choose the best move (with slight randomization among equally good moves)
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    expertEvaluateMove(pitIndex) {
        // Deep analysis of a move considering all Pallanguzhi rules
        const simulation = this.simulateCompleteMove(pitIndex, 2);
        
        let score = 0;
        
        // 1. Immediate capture value (highest priority)
        score += simulation.capturedDots * 50;
        
        // 2. Turn continuation bonus (very important in Pallanguzhi)
        if (simulation.continuesTurn) {
            score += 30;
            // Extra bonus for multiple turn continuations
            score += simulation.turnLength * 10;
        }
        
        // 3. Strategic positioning
        score += this.evaluateStrategicPosition(simulation.finalBoard, 2) * 20;
        
        // 4. Defensive considerations
        score -= this.evaluateOpponentThreats(simulation.finalBoard, 1) * 15;
        
        // 5. Endgame considerations
        const totalDots = simulation.finalBoard.reduce((sum, pit) => sum + pit, 0);
        if (totalDots <= 15) {
            score += this.evaluateEndgame(simulation.finalBoard, 2) * 40;
        }
        
        // 6. Opening strategy
        if (totalDots > 50) {
            score += this.evaluateOpening(pitIndex) * 10;
        }
        
        // 7. Avoid giving opponent good opportunities
        const opponentBestMove = this.findBestOpponentResponse(simulation.finalBoard);
        if (opponentBestMove.captureValue > 5) {
            score -= opponentBestMove.captureValue * 25;
        }
        
        return score;
    }

    simulateCompleteMove(startPit, player) {
        // Simulate the complete move including all captures and continuations
        const board = [...this.board];
        let currentPlayer = player;
        let capturedDots = 0;
        let turnLength = 0;
        let continuesTurn = false;
        let currentPit = startPit;
        
        // Simulate the full turn
        while (true) {
            if (board[currentPit] === 0) break;
            
            let counters = board[currentPit];
            board[currentPit] = 0;
            turnLength++;
            
            // Distribute counters
            for (let i = 0; i < counters; i++) {
                currentPit = this.getNextPitFromBoard(currentPit, board);
                board[currentPit]++;
            }
            
            // Check for captures
            const nextPit = this.getNextPitFromBoard(currentPit, board);
            if (board[nextPit] === 0) {
                const captureFromPit = this.getNextPitFromBoard(nextPit, board);
                if (board[captureFromPit] > 0) {
                    capturedDots += board[captureFromPit];
                    board[captureFromPit] = 0;
                }
            }
            
            // Check if turn continues
            const shouldContinue = this.shouldContinueTurnFromBoard(currentPit, board);
            if (shouldContinue) {
                continuesTurn = true;
                currentPit = this.getNextPitFromBoard(currentPit, board);
            } else {
                break;
            }
        }
        
        return {
            finalBoard: board,
            capturedDots: capturedDots,
            continuesTurn: continuesTurn,
            turnLength: turnLength,
            finalPit: currentPit
        };
    }

    shouldContinueTurnFromBoard(lastPit, board) {
        const nextPit = this.getNextPitFromBoard(lastPit, board);
        return board[nextPit] > 0;
    }

    evaluateStrategicPosition(board, player) {
        let score = 0;
        const ourStart = player === 2 ? 7 : 0;
        const ourEnd = player === 2 ? 13 : 6;
        
        // Prefer having dots in positions that can lead to captures
        for (let i = ourStart; i <= ourEnd; i++) {
            const dots = board[i];
            if (dots > 0) {
                // Calculate where this move would land
                let landingPit = i;
                for (let j = 0; j < dots; j++) {
                    landingPit = this.getNextPitFromBoard(landingPit, board);
                }
                
                // Check if landing position could lead to capture
                const nextAfterLanding = this.getNextPitFromBoard(landingPit, board);
                if (board[nextAfterLanding] === 0) {
                    const captureFromPit = this.getNextPitFromBoard(nextAfterLanding, board);
                    if (board[captureFromPit] > 0) {
                        score += board[captureFromPit] * 2; // Potential capture value
                    }
                }
                
                // Prefer moves that continue the turn
                if (board[landingPit] > 0) {
                    score += 3;
                }
            }
        }
        
        return score;
    }

    evaluateOpponentThreats(board, opponentPlayer) {
        let threatScore = 0;
        const oppStart = opponentPlayer === 1 ? 0 : 7;
        const oppEnd = opponentPlayer === 1 ? 6 : 13;
        
        // Check each opponent pit for potential captures
        for (let i = oppStart; i <= oppEnd; i++) {
            const dots = board[i];
            if (dots > 0) {
                let landingPit = i;
                for (let j = 0; j < dots; j++) {
                    landingPit = this.getNextPitFromBoard(landingPit, board);
                }
                
                const nextAfterLanding = this.getNextPitFromBoard(landingPit, board);
                if (board[nextAfterLanding] === 0) {
                    const captureFromPit = this.getNextPitFromBoard(nextAfterLanding, board);
                    if (board[captureFromPit] > 0) {
                        threatScore += board[captureFromPit];
                    }
                }
            }
        }
        
        return threatScore;
    }

    evaluateEndgame(board, player) {
        let score = 0;
        const ourStart = player === 2 ? 7 : 0;
        const ourEnd = player === 2 ? 13 : 6;
        const oppStart = player === 2 ? 0 : 7;
        const oppEnd = player === 2 ? 6 : 13;
        
        let ourDots = 0, oppDots = 0;
        for (let i = ourStart; i <= ourEnd; i++) ourDots += board[i];
        for (let i = oppStart; i <= oppEnd; i++) oppDots += board[i];
        
        // In endgame, having more dots is crucial
        score += (ourDots - oppDots) * 10;
        
        // Bonus for forcing opponent into no-move situation
        if (oppDots === 0) {
            score += 100;
        }
        
        // Prefer moves that can capture remaining dots
        for (let i = ourStart; i <= ourEnd; i++) {
            if (board[i] > 0) {
                const simulation = this.simulateCompleteMove(i, player);
                score += simulation.capturedDots * 5;
            }
        }
        
        return score;
    }

    evaluateOpening(pitIndex) {
        // Opening strategy: prefer middle pits and avoid edge pits
        const middlePits = [9, 10, 11]; // CPU's middle pits
        if (middlePits.includes(pitIndex)) {
            return 5;
        }
        return 0;
    }

    findBestOpponentResponse(board) {
        let bestCapture = 0;
        const oppMoves = this.getAvailableMovesFromBoard(board, 1);
        
        for (const move of oppMoves) {
            const simulation = this.simulateCompleteMoveOnBoard(board, move, 1);
            if (simulation.capturedDots > bestCapture) {
                bestCapture = simulation.capturedDots;
            }
        }
        
        return { captureValue: bestCapture };
    }

    simulateCompleteMoveOnBoard(board, startPit, player) {
        const boardCopy = [...board];
        let capturedDots = 0;
        let currentPit = startPit;
        
        while (true) {
            if (boardCopy[currentPit] === 0) break;
            
            let counters = boardCopy[currentPit];
            boardCopy[currentPit] = 0;
            
            for (let i = 0; i < counters; i++) {
                currentPit = this.getNextPitFromBoard(currentPit, boardCopy);
                boardCopy[currentPit]++;
            }
            
            const nextPit = this.getNextPitFromBoard(currentPit, boardCopy);
            if (boardCopy[nextPit] === 0) {
                const captureFromPit = this.getNextPitFromBoard(nextPit, boardCopy);
                if (boardCopy[captureFromPit] > 0) {
                    capturedDots += boardCopy[captureFromPit];
                    boardCopy[captureFromPit] = 0;
                }
            }
            
            if (!this.shouldContinueTurnFromBoard(currentPit, boardCopy)) {
                break;
            }
            currentPit = this.getNextPitFromBoard(currentPit, boardCopy);
        }
        
        return { capturedDots: capturedDots };
    }

    createGameState() {
        return {
            board: [...this.board],
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            currentPlayer: this.currentPlayer
        };
    }

    simulateMove(gameState, pitIndex, player) {
        const board = [...gameState.board];
        let score1 = gameState.player1Score;
        let score2 = gameState.player2Score;
        
        let currentPit = pitIndex;
        let counters = board[currentPit];
        board[currentPit] = 0;

        // Distribute counters
        for (let i = 0; i < counters; i++) {
            currentPit = this.getNextPitFromBoard(currentPit, board);
            board[currentPit]++;
        }

        // Check for captures
        const nextPit = this.getNextPitFromBoard(currentPit, board);
        if (board[nextPit] === 0) {
            const captureFromPit = this.getNextPitFromBoard(nextPit, board);
            if (board[captureFromPit] > 0) {
                const captured = board[captureFromPit];
                board[captureFromPit] = 0;
                if (player === 1) {
                    score1 += captured;
                } else {
                    score2 += captured;
                }
            }
        }

        return {
            board: board,
            player1Score: score1,
            player2Score: score2,
            lastPit: currentPit
        };
    }

    evaluatePosition(gameState, player) {
        let score = 0;
        
        // Score difference (most important)
        const scoreDiff = gameState.player2Score - gameState.player1Score;
        score += scoreDiff * 100;
        
        // Board control - dots on our side vs opponent's side
        let ourDots = 0, opponentDots = 0;
        const ourStart = player === 2 ? 7 : 0;
        const ourEnd = player === 2 ? 13 : 6;
        const oppStart = player === 2 ? 0 : 7;
        const oppEnd = player === 2 ? 6 : 13;
        
        for (let i = ourStart; i <= ourEnd; i++) {
            ourDots += gameState.board[i];
        }
        for (let i = oppStart; i <= oppEnd; i++) {
            opponentDots += gameState.board[i];
        }
        
        // Prefer having more dots on our side (mobility)
        score += (ourDots - opponentDots) * 5;
        
        // Endgame evaluation
        const totalDots = ourDots + opponentDots;
        if (totalDots <= 10) {
            // In endgame, prioritize capturing remaining dots
            score += ourDots * 20;
            
            // Bonus for having opponent with no moves
            if (opponentDots === 0) {
                score += 1000;
            }
        }
        
        // Positional evaluation - prefer dots in middle pits
        for (let i = ourStart; i <= ourEnd; i++) {
            const position = Math.abs(i - (ourStart + ourEnd) / 2);
            score += gameState.board[i] * (3 - position);
        }
        
        // Defensive evaluation - penalize opponent's good positions
        for (let i = oppStart; i <= oppEnd; i++) {
            if (gameState.board[i] > 5) {
                score -= gameState.board[i] * 3; // Penalize opponent's large pits
            }
        }
        
        return score;
    }

    getAvailableMovesFromBoard(board, player) {
        const moves = [];
        const startPit = player === 1 ? 0 : 7;
        const endPit = player === 1 ? 6 : 13;

        for (let i = startPit; i <= endPit; i++) {
            if (board[i] > 0 && !this.disabledPits.has(i)) {
                moves.push(i);
            }
        }
        return moves;
    }

    getNextPitFromBoard(currentPit, board) {
        let nextPit = (currentPit + 1) % 14;
        while (this.disabledPits.has(nextPit)) {
            nextPit = (nextPit + 1) % 14;
            if (nextPit === currentPit) break;
        }
        return nextPit;
    }

    isGameOverState(board) {
        const totalDots = board.reduce((sum, pit) => sum + pit, 0);
        return totalDots <= 1;
    }

    isEarlyGame() {
        const totalDots = this.board.reduce((sum, pit) => sum + pit, 0);
        return totalDots > 50; // Early game if more than 50 dots remain
    }

    getStrategicOpeningMove(availableMoves) {
        // Expert opening strategy: prefer moves from middle pits
        const middlePits = [9, 10, 11]; // CPU's middle pits
        
        for (const pit of middlePits) {
            if (availableMoves.includes(pit) && this.board[pit] >= 3) {
                return pit;
            }
        }
        
        return -1; // No strategic opening move found
    }

    evaluateMove(pitIndex, player) {
        // Simplified evaluation for medium difficulty
        const gameState = this.createGameState();
        const result = this.simulateMove(gameState, pitIndex, player);
        
        let score = 0;
        
        // Immediate captures
        const captureGain = (player === 1 ? result.player1Score - gameState.player1Score : 
                           result.player2Score - gameState.player2Score);
        score += captureGain * 15;
        
        // Turn continuation potential
        const nextPit = this.getNextPitFromBoard(result.lastPit, result.board);
        if (result.board[nextPit] > 0) {
            score += 8; // Bonus for continuing turn
        }
        
        // Prefer moves that don't leave big pits for opponent
        if (result.board[result.lastPit] > 6) {
            score -= 5;
        }
        
        return score;
    }
}

// Initialize the game when the page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new PallanguzhiGame();

    // Close rules popup when clicking outside
    document.getElementById('rules-popup').addEventListener('click', (e) => {
        if (e.target.id === 'rules-popup') {
            game.hideRules();
        }
    });

    // Close about popup when clicking outside
    document.getElementById('about-popup').addEventListener('click', (e) => {
        if (e.target.id === 'about-popup') {
            game.hideAbout();
        }
    });
});