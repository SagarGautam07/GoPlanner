// Timer Constants
const STUDY_TIME = 25 * 60; // 25 minutes in seconds
const BREAK_TIME = 5 * 60; // 5 minutes in seconds
const LONG_BREAK_TIME = 15 * 60; // 15 minutes in seconds
const SESSIONS_BEFORE_LONG_BREAK = 4;

// Timer State
let timerState = {
    timeRemaining: STUDY_TIME,
    isRunning: false,
    isBreak: false,
    currentSession: 1,
    interval: null,
    startTime: null,
    pausedTime: null,
    totalStudyTime: 0,
    focusScore: 100,
    notes: []
};

// Initialize Session Page
document.addEventListener('DOMContentLoaded', () => {
    setupTimerControls();
    setupNotesControls();
    loadSessionState();
    updateTimerDisplay();
    updateSessionInfo();
    initializeSubjects();
    window.sessionTimer = new SessionTimer();
});

// Timer Controls Setup
function setupTimerControls() {
    document.getElementById('startTimer').addEventListener('click', startTimer);
    document.getElementById('pauseTimer').addEventListener('click', pauseTimer);
    document.getElementById('resetTimer').addEventListener('click', resetTimer);
}

// Notes Controls Setup
function setupNotesControls() {
    document.getElementById('saveNote').addEventListener('click', saveNote);
    document.getElementById('clearNote').addEventListener('click', clearNote);

    // Auto-save functionality
    let autoSaveTimeout;
    document.getElementById('noteContent').addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(autoSaveNote, 2000); // Auto-save after 2 seconds of inactivity
    });
}

// Timer Control Functions
function startTimer() {
    if (!timerState.isRunning) {
        timerState.isRunning = true;
        timerState.startTime = Date.now() - ((STUDY_TIME - timerState.timeRemaining) * 1000);
        
        updateButtonStates(true);
        
        timerState.interval = setInterval(() => {
            updateTimer();
            updateCircleProgress();
        }, 1000);

        // Show notification
        AppUtils.showNotification(
            timerState.isBreak ? 'Break time started!' : 'Study session started!',
            'success'
        );
    }
}

function pauseTimer() {
    if (timerState.isRunning) {
        timerState.isRunning = false;
        timerState.pausedTime = timerState.timeRemaining;
        clearInterval(timerState.interval);
        updateButtonStates(false);
        
        // Calculate focus score penalty for pausing
        timerState.focusScore = Math.max(0, timerState.focusScore - 5);
        updateStats();
        
        AppUtils.showNotification('Session paused', 'info');
    }
}

function resetTimer() {
    clearInterval(timerState.interval);
    timerState.isRunning = false;
    timerState.timeRemaining = timerState.isBreak ? 
        (timerState.currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME) : 
        STUDY_TIME;
    
    updateButtonStates(false);
    updateTimerDisplay();
    updateCircleProgress();
    
    AppUtils.showNotification('Timer reset', 'info');
}

// Timer Update Functions
function updateTimer() {
    const now = Date.now();
    const elapsed = Math.floor((now - timerState.startTime) / 1000);
    timerState.timeRemaining = Math.max(0, timerState.isBreak ? 
        (timerState.currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME) : 
        STUDY_TIME - elapsed);

    if (timerState.timeRemaining === 0) {
        handleTimerComplete();
    } else {
        updateTimerDisplay();
    }
}

function handleTimerComplete() {
    clearInterval(timerState.interval);
    timerState.isRunning = false;
    
    if (!timerState.isBreak) {
        // Study session complete
        timerState.totalStudyTime += STUDY_TIME;
        updateStats();
        
        // Switch to break
        timerState.isBreak = true;
        timerState.timeRemaining = timerState.currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? 
            LONG_BREAK_TIME : BREAK_TIME;
        
        AppUtils.showNotification('Great job! Time for a break!', 'success');
    } else {
        // Break complete
        timerState.isBreak = false;
        timerState.currentSession++;
        timerState.timeRemaining = STUDY_TIME;
        
        AppUtils.showNotification('Break complete! Ready to study?', 'success');
    }
    
    updateButtonStates(false);
    updateTimerDisplay();
    updateSessionInfo();
    updateCircleProgress();
    
    // Play notification sound
    playNotificationSound();
}

// UI Update Functions
function updateTimerDisplay() {
    const minutes = Math.floor(timerState.timeRemaining / 60);
    const seconds = timerState.timeRemaining % 60;
    
    document.getElementById('timerMinutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('timerSeconds').textContent = seconds.toString().padStart(2, '0');
}

function updateCircleProgress() {
    const circle = document.querySelector('.timer-progress');
    const totalTime = timerState.isBreak ? 
        (timerState.currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME) : 
        STUDY_TIME;
    const progress = (timerState.timeRemaining / totalTime);
    
    const circumference = 2 * Math.PI * 45; // r=45 from SVG
    const offset = circumference * (1 - progress);
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
}

function updateButtonStates(isRunning) {
    document.getElementById('startTimer').disabled = isRunning;
    document.getElementById('pauseTimer').disabled = !isRunning;
    document.getElementById('resetTimer').disabled = !isRunning && timerState.timeRemaining === (timerState.isBreak ? 
        (timerState.currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME) : 
        STUDY_TIME);
}

function updateSessionInfo() {
    document.getElementById('sessionType').textContent = timerState.isBreak ? 'Break Time' : 'Study Time';
    document.getElementById('currentSession').textContent = timerState.currentSession;
    document.getElementById('totalSessions').textContent = SESSIONS_BEFORE_LONG_BREAK;
}

function updateStats() {
    // Update total study time
    const hours = Math.floor(timerState.totalStudyTime / 3600);
    const minutes = Math.floor((timerState.totalStudyTime % 3600) / 60);
    document.getElementById('totalStudyTime').textContent = 
        `${hours}:${minutes.toString().padStart(2, '0')}`;
    
    // Update focus score
    document.getElementById('focusScore').textContent = `${timerState.focusScore}%`;
    
    // Update notes count
    document.getElementById('notesCount').textContent = timerState.notes.length;
}

// Notes Functions
function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    
    if (!title || !content) {
        AppUtils.showNotification('Please enter both title and content', 'error');
        return;
    }
    
    const note = {
        id: Date.now(),
        title,
        content,
        timestamp: new Date().toISOString(),
        sessionNumber: timerState.currentSession
    };
    
    timerState.notes.push(note);
    saveSessionState();
    
    AppUtils.showNotification('Note saved successfully!', 'success');
    updateStats();
    
    // Animate save button
    const saveButton = document.getElementById('saveNote');
    saveButton.classList.add('button-success');
    setTimeout(() => saveButton.classList.remove('button-success'), 1000);
}

function clearNote() {
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    AppUtils.showNotification('Note cleared', 'info');
}

function autoSaveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    
    if (title && content) {
        saveNote();
    }
}

// State Management
function saveSessionState() {
    saveToLocalStorage('sessionState', {
        timeRemaining: timerState.timeRemaining,
        isBreak: timerState.isBreak,
        currentSession: timerState.currentSession,
        totalStudyTime: timerState.totalStudyTime,
        focusScore: timerState.focusScore,
        notes: timerState.notes
    });
}

function loadSessionState() {
    const savedState = JSON.parse(localStorage.getItem('sessionState'));
    if (savedState) {
        timerState = { ...timerState, ...savedState };
        updateStats();
    }
}

// Utility Functions
function playNotificationSound() {
    // Create and play a simple notification sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Session Timer Management
class SessionTimer {
    constructor() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.breakTimerDisplay = document.getElementById('breakTimerDisplay');
        this.startButton = document.getElementById('startTimer');
        this.resetButton = document.getElementById('resetTimer');
        this.skipBreakButton = document.getElementById('skipBreak');
        this.sessionCountDisplay = document.getElementById('sessionCount');
        this.totalTimeDisplay = document.getElementById('totalTime');
        this.breakModal = document.getElementById('breakModal');
        this.startBreakBtn = document.getElementById('startBreakBtn');
        this.skipBreakBtn = document.getElementById('skipBreakBtn');

        this.timerCircle = document.querySelector('.timer-progress .timer-foreground');
        this.breakTimerCircle = document.querySelector('#breakModal .timer-progress .timer-foreground');
        
        this.isRunning = false;
        this.isBreak = false;
        this.timeLeft = 25 * 60; // Default 25 minutes
        this.breakTimeLeft = 5 * 60; // Default 5 minutes
        this.totalTime = 0;
        this.currentSession = 1;
        this.totalSessions = 4;
        this.timer = null;

        this.setupEventListeners();
        this.updateCircleProgress();
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.toggleTimer());
        this.resetButton.addEventListener('click', () => this.resetTimer());
        this.skipBreakButton.addEventListener('click', () => this.skipBreak());
        this.startBreakBtn.addEventListener('click', () => this.startBreak());
        this.skipBreakBtn.addEventListener('click', () => this.skipBreak());

        // Form submission
        document.getElementById('sessionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateSettings();
        });

        // Session notes
        document.getElementById('saveNotes').addEventListener('click', () => this.saveNotes());
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.startButton.innerHTML = '<span class="material-icons">pause</span>Pause';
        this.timer = setInterval(() => this.updateTimer(), 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.startButton.innerHTML = '<span class="material-icons">play_arrow</span>Resume';
        clearInterval(this.timer);
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = parseInt(document.getElementById('sessionDuration').value) * 60;
        this.startButton.innerHTML = '<span class="material-icons">play_arrow</span>Start';
        this.updateDisplay();
        this.updateCircleProgress();
    }

    updateTimer() {
        if (this.isBreak) {
            this.breakTimeLeft--;
            if (this.breakTimeLeft <= 0) {
                this.endBreak();
            }
            this.updateBreakDisplay();
        } else {
            this.timeLeft--;
            this.totalTime++;
            if (this.timeLeft <= 0) {
                this.endSession();
            }
            this.updateDisplay();
        }
        this.updateCircleProgress();
    }

    endSession() {
        this.pauseTimer();
        if (this.currentSession < this.totalSessions) {
            this.showBreakModal();
        } else {
            this.completeAllSessions();
        }
    }

    showBreakModal() {
        this.breakModal.style.display = 'block';
        this.breakTimeLeft = parseInt(document.getElementById('breakDuration').value) * 60;
        this.updateBreakDisplay();
    }

    startBreak() {
        this.isBreak = true;
        this.breakModal.style.display = 'none';
        this.startTimer();
    }

    skipBreak() {
        this.breakModal.style.display = 'none';
        this.startNextSession();
    }

    endBreak() {
        this.isBreak = false;
        this.pauseTimer();
        this.startNextSession();
    }

    startNextSession() {
        this.currentSession++;
        this.timeLeft = parseInt(document.getElementById('sessionDuration').value) * 60;
        this.updateDisplay();
        this.updateSessionCount();
        this.startTimer();
    }

    completeAllSessions() {
        alert('Congratulations! You have completed all sessions.');
        this.resetTimer();
        this.currentSession = 1;
        this.updateSessionCount();
    }

    updateSettings() {
        const sessionDuration = parseInt(document.getElementById('sessionDuration').value);
        const breakDuration = parseInt(document.getElementById('breakDuration').value);
        const sessionsCount = parseInt(document.getElementById('sessionsCount').value);

        this.timeLeft = sessionDuration * 60;
        this.breakTimeLeft = breakDuration * 60;
        this.totalSessions = sessionsCount;
        this.currentSession = 1;

        this.updateDisplay();
        this.updateSessionCount();
        this.updateCircleProgress();
    }

    updateDisplay() {
        this.timerDisplay.textContent = this.formatTime(this.timeLeft);
        this.totalTimeDisplay.textContent = this.formatTime(this.totalTime);
    }

    updateBreakDisplay() {
        this.breakTimerDisplay.textContent = this.formatTime(this.breakTimeLeft);
    }

    updateSessionCount() {
        this.sessionCountDisplay.textContent = `${this.currentSession}/${this.totalSessions}`;
    }

    updateCircleProgress() {
        const progress = this.isBreak ? 
            (this.breakTimeLeft / (parseInt(document.getElementById('breakDuration').value) * 60)) :
            (this.timeLeft / (parseInt(document.getElementById('sessionDuration').value) * 60));
        
        const circle = this.isBreak ? this.breakTimerCircle : this.timerCircle;
        const circumference = 2 * Math.PI * 45;
        const offset = circumference * (1 - progress);
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    saveNotes() {
        const notes = document.getElementById('sessionNotes').value;
        const subject = document.getElementById('subjectSelect').value;
        const topic = document.getElementById('topicSelect').value;
        
        // Save notes to localStorage
        const sessionData = {
            subject,
            topic,
            notes,
            timestamp: new Date().toISOString(),
            duration: this.totalTime
        };

        let savedNotes = JSON.parse(localStorage.getItem('sessionNotes') || '[]');
        savedNotes.push(sessionData);
        localStorage.setItem('sessionNotes', JSON.stringify(savedNotes));

        // Show confirmation
        alert('Notes saved successfully!');
    }
}

// Initialize subjects and topics
function initializeSubjects() {
    const subjects = [
        { id: 1, name: 'Mathematics' },
        { id: 2, name: 'Physics' },
        { id: 3, name: 'Chemistry' },
        { id: 4, name: 'Biology' }
    ];

    const topics = {
        1: ['Algebra', 'Calculus', 'Geometry', 'Statistics'],
        2: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Physics'],
        3: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
        4: ['Cell Biology', 'Genetics', 'Ecology', 'Evolution']
    };

    const subjectSelect = document.getElementById('subjectSelect');
    const topicSelect = document.getElementById('topicSelect');

    // Populate subjects
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
    });

    // Update topics when subject changes
    subjectSelect.addEventListener('change', () => {
        const selectedSubject = subjectSelect.value;
        topicSelect.innerHTML = ''; // Clear existing options

        topics[selectedSubject].forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            topicSelect.appendChild(option);
        });
    });

    // Trigger initial topic population
    subjectSelect.dispatchEvent(new Event('change'));
} 