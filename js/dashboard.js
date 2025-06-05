class Dashboard {
    constructor() {
        this.tasks = [];
        this.exams = [];
        this.quotes = [
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
            { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
            { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
            { text: "The expert in anything was once a beginner.", author: "Helen Hayes" }
        ];

        this.initializeElements();
        this.setupEventListeners();
        this.loadData();
        this.updateDashboard();
        this.startCountdowns();
        this.updateMotivationalQuote();
    }

    initializeElements() {
        this.tasksList = document.getElementById('todayTasks');
        this.examCountdowns = document.getElementById('examCountdowns');
        this.quoteContainer = document.getElementById('motivationalQuote');
        this.addTaskBtn = document.querySelector('.add-task-btn');
    }

    setupEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
        
        // Task list event delegation
        this.tasksList.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;

            if (e.target.classList.contains('task-checkbox')) {
                this.toggleTaskComplete(taskItem.dataset.id);
            } else if (e.target.classList.contains('task-delete')) {
                this.deleteTask(taskItem.dataset.id);
            }
        });
    }

    loadData() {
        // Load tasks
        const savedTasks = localStorage.getItem('dashboardTasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks).map(task => ({
                ...task,
                dueDate: new Date(task.dueDate)
            }));
        }

        // Load exams
        const savedExams = localStorage.getItem('exams');
        if (savedExams) {
            this.exams = JSON.parse(savedExams).map(exam => ({
                ...exam,
                date: new Date(exam.date)
            }));
        }

        // Load progress data
        const savedProgress = localStorage.getItem('studyProgress');
        if (savedProgress) {
            this.progress = JSON.parse(savedProgress);
        } else {
            this.progress = {
                syllabusCompletion: 0,
                dailyStreak: 0,
                lastStudyDate: null
            };
        }
    }

    updateDashboard() {
        this.renderTasks();
        this.renderExams();
        this.updateProgress();
    }

    renderTasks() {
        const today = new Date();
        const todaysTasks = this.tasks.filter(task => 
            this.isSameDay(task.dueDate, today)
        );

        this.tasksList.innerHTML = todaysTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox">
                    <span class="material-icons">${task.completed ? 'check_box' : 'check_box_outline_blank'}</span>
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-subject">${task.subject}</div>
                </div>
                <div class="task-actions">
                    <button class="btn-icon task-delete" aria-label="Delete task">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `).join('') || '<p class="text-muted">No tasks for today</p>';
    }

    renderExams() {
        const upcomingExams = this.exams
            .filter(exam => exam.date > new Date())
            .sort((a, b) => a.date - b.date)
            .slice(0, 3);

        this.examCountdowns.innerHTML = upcomingExams.map(exam => `
            <div class="countdown-card">
                <div class="countdown-header">
                    <h3>${exam.subject}</h3>
                    <span class="exam-date">
                        ${exam.date.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    </span>
                </div>
                <div class="countdown-timer" data-exam-id="${exam.id}">
                    <div class="countdown-segment">
                        <span class="countdown-number days">--</span>
                        <span class="countdown-label">days</span>
                    </div>
                    <div class="countdown-segment">
                        <span class="countdown-number hours">--</span>
                        <span class="countdown-label">hours</span>
                    </div>
                    <div class="countdown-segment">
                        <span class="countdown-number minutes">--</span>
                        <span class="countdown-label">min</span>
                    </div>
                </div>
            </div>
        `).join('') || '<p class="text-muted">No upcoming exams</p>';
    }

    startCountdowns() {
        clearInterval(this.countdownInterval);
        this.countdownInterval = setInterval(() => {
            const now = new Date();
            
            this.exams.forEach(exam => {
                const countdown = document.querySelector(`[data-exam-id="${exam.id}"]`);
                if (!countdown) return;

                const timeLeft = exam.date - now;
                if (timeLeft <= 0) {
                    countdown.innerHTML = '<span class="exam-ended">Exam ended</span>';
                    return;
                }

                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                countdown.querySelector('.days').textContent = days;
                countdown.querySelector('.hours').textContent = hours;
                countdown.querySelector('.minutes').textContent = minutes;
            });
        }, 1000);
    }

    updateProgress() {
        // Update syllabus completion
        const completionBar = document.querySelector('.progress-fill');
        const completionValue = document.querySelector('.progress-value');
        if (completionBar && completionValue) {
            completionBar.style.width = `${this.progress.syllabusCompletion}%`;
            completionValue.textContent = `${this.progress.syllabusCompletion}%`;
        }

        // Update daily streak
        const streakNumber = document.querySelector('.streak-number');
        if (streakNumber) {
            streakNumber.textContent = this.progress.dailyStreak;
        }

        // Check and update streak
        this.updateDailyStreak();
    }

    updateDailyStreak() {
        const today = new Date();
        const lastStudy = this.progress.lastStudyDate ? new Date(this.progress.lastStudyDate) : null;

        if (!lastStudy) {
            this.progress.dailyStreak = 0;
        } else if (!this.isSameDay(lastStudy, today)) {
            const daysSinceLastStudy = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
            if (daysSinceLastStudy > 1) {
                this.progress.dailyStreak = 0;
            }
        }

        this.saveProgress();
    }

    updateMotivationalQuote() {
        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        this.quoteContainer.innerHTML = `
            <blockquote class="quote">
                <p>${randomQuote.text}</p>
                <footer>— ${randomQuote.author}</footer>
            </blockquote>
        `;
    }

    showAddTaskModal() {
        // Create and show modal for adding new task
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Task</h3>
                    <button class="btn-icon modal-close" aria-label="Close modal">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="addTaskForm">
                        <div class="form-group">
                            <label for="taskTitle">Task Title</label>
                            <input type="text" id="taskTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="taskSubject">Subject</label>
                            <select id="taskSubject" required>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Biology">Biology</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="taskDueDate">Due Date</label>
                            <input type="date" id="taskDueDate" required>
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary modal-close">Cancel</button>
                    <button class="btn-primary" id="saveTask">Add Task</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal event listeners
        const closeButtons = modal.querySelectorAll('.modal-close');
        const saveButton = modal.querySelector('#saveTask');
        const form = modal.querySelector('#addTaskForm');

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.remove();
            });
        });

        saveButton.addEventListener('click', () => {
            if (form.checkValidity()) {
                this.addTask({
                    title: form.taskTitle.value,
                    subject: form.taskSubject.value,
                    dueDate: new Date(form.taskDueDate.value)
                });
                modal.remove();
            } else {
                form.reportValidity();
            }
        });
    }

    addTask(taskData) {
        const task = {
            id: Date.now(),
            title: taskData.title,
            subject: taskData.subject,
            dueDate: taskData.dueDate,
            completed: false
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        AppUtils.showNotification('Task added successfully!', 'success');
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === parseInt(taskId));
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();

            // Update progress if completed
            if (task.completed) {
                this.updateSyllabusProgress(1);
            }
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== parseInt(taskId));
            this.saveTasks();
            this.renderTasks();
            AppUtils.showNotification('Task deleted successfully!', 'success');
        }
    }

    updateSyllabusProgress(increment) {
        this.progress.syllabusCompletion = Math.min(
            100,
            this.progress.syllabusCompletion + increment
        );
        this.saveProgress();
        this.updateProgress();
    }

    saveTasks() {
        localStorage.setItem('dashboardTasks', JSON.stringify(this.tasks));
    }

    saveProgress() {
        localStorage.setItem('studyProgress', JSON.stringify(this.progress));
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
}); 