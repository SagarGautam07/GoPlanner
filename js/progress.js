// Progress Page Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeProgressPage();
});

// Initialize Progress Page
function initializeProgressPage() {
    updateOverviewStats();
    renderStudyDistribution();
    renderWeeklyStudyHours();
    renderSyllabusProgress();
    renderAchievements();
}

// Overview Stats
function updateOverviewStats() {
    // Total Study Time
    const totalHours = Math.floor(AppUtils.AppState.totalStudyTime / 3600);
    document.getElementById('totalStudyTime').textContent = `${totalHours} hours`;
    animateNumber('totalStudyTime', 0, totalHours);

    // Study Streak
    const streak = AppUtils.AppState.streak.current;
    document.getElementById('currentStreak').textContent = `${streak} days`;
    animateNumber('currentStreak', 0, streak);

    // Tasks Completed
    const completedTasks = AppUtils.AppState.tasks.filter(task => task.completed).length;
    document.getElementById('tasksCompleted').textContent = completedTasks;
    animateNumber('tasksCompleted', 0, completedTasks);

    // Average Focus Score
    const avgFocus = calculateAverageFocusScore();
    document.getElementById('avgFocusScore').textContent = `${avgFocus}%`;
    animateNumber('avgFocusScore', 0, avgFocus);
}

// Study Distribution Chart
function renderStudyDistribution() {
    const svg = document.querySelector('#studyDistribution svg');
    const legend = document.getElementById('studyDistributionLegend');
    const data = calculateStudyDistribution();
    
    // Clear previous content
    svg.innerHTML = '';
    legend.innerHTML = '';
    
    let startAngle = 0;
    const colors = ['#4a90e2', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
    
    data.forEach((item, index) => {
        const percentage = (item.hours / data.reduce((sum, d) => sum + d.hours, 0)) * 100;
        const endAngle = startAngle + (percentage * 3.6); // 3.6 = 360/100
        
        // Create pie segment
        const segment = createPieSegment(50, 50, 40, startAngle, endAngle, colors[index]);
        svg.appendChild(segment);
        
        // Create legend item
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${colors[index]}"></span>
            <span class="legend-label">${item.subject}</span>
            <span class="legend-value">${item.hours}h (${Math.round(percentage)}%)</span>
        `;
        legend.appendChild(legendItem);
        
        startAngle = endAngle;
    });
}

// Weekly Study Hours Chart
function renderWeeklyStudyHours() {
    const container = document.getElementById('weeklyStudyHours');
    const data = calculateWeeklyStudyHours();
    
    container.innerHTML = `
        <div class="chart-bars">
            ${data.map(day => `
                <div class="bar-container">
                    <div class="bar-label">${day.label}</div>
                    <div class="bar">
                        <div class="bar-fill" style="height: ${(day.hours / Math.max(...data.map(d => d.hours))) * 100}%">
                            <span class="bar-value">${day.hours}h</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Syllabus Progress
function renderSyllabusProgress() {
    const container = document.getElementById('syllabusProgress');
    const progress = calculateSyllabusProgress();
    
    container.innerHTML = progress.map(subject => `
        <div class="completion-item">
            <div class="completion-header">
                <h4>${subject.name}</h4>
                <span>${Math.round(subject.progress)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        </div>
    `).join('');
    
    // Animate progress bars
    setTimeout(() => {
        document.querySelectorAll('.progress-fill').forEach((fill, index) => {
            fill.style.width = `${progress[index].progress}%`;
        });
    }, 100);
}

// Achievements
function renderAchievements() {
    const container = document.getElementById('achievementsList');
    const achievements = calculateAchievements();
    
    container.innerHTML = achievements.map(achievement => `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">
                <span class="material-icons">${achievement.icon}</span>
            </div>
            <div class="achievement-content">
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
                ${achievement.progress ? `
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                        </div>
                        <span>${achievement.progress}%</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Data Calculation Functions
function calculateAverageFocusScore() {
    const sessions = AppUtils.AppState.sessions || [];
    if (sessions.length === 0) return 0;
    
    const totalScore = sessions.reduce((sum, session) => sum + session.focusScore, 0);
    return Math.round(totalScore / sessions.length);
}

function calculateStudyDistribution() {
    const sessions = AppUtils.AppState.sessions || [];
    const distribution = {};
    
    sessions.forEach(session => {
        if (!distribution[session.subject]) {
            distribution[session.subject] = 0;
        }
        distribution[session.subject] += session.duration / 3600; // Convert seconds to hours
    });
    
    return Object.entries(distribution).map(([subject, hours]) => ({
        subject,
        hours: Math.round(hours)
    }));
}

function calculateWeeklyStudyHours() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sessions = AppUtils.AppState.sessions || [];
    const weeklyHours = Array(7).fill(0);
    
    sessions.forEach(session => {
        const date = new Date(session.timestamp);
        weeklyHours[date.getDay()] += session.duration / 3600;
    });
    
    return days.map((label, index) => ({
        label,
        hours: Math.round(weeklyHours[index])
    }));
}

function calculateSyllabusProgress() {
    const subjects = AppUtils.AppState.studyPlan?.subjects || [];
    return subjects.map(subject => ({
        name: subject.name,
        progress: (subject.completedTopics / subject.totalTopics) * 100
    }));
}

function calculateAchievements() {
    const streak = AppUtils.AppState.streak.current;
    const totalHours = AppUtils.AppState.totalStudyTime / 3600;
    const completedTasks = AppUtils.AppState.tasks.filter(task => task.completed).length;
    
    return [
        {
            title: 'Study Streak',
            description: 'Maintain a daily study streak',
            icon: 'local_fire_department',
            unlocked: streak >= 7,
            progress: Math.min(100, (streak / 7) * 100)
        },
        {
            title: 'Time Master',
            description: 'Study for 50 hours total',
            icon: 'schedule',
            unlocked: totalHours >= 50,
            progress: Math.min(100, (totalHours / 50) * 100)
        },
        {
            title: 'Task Champion',
            description: 'Complete 100 study tasks',
            icon: 'task_alt',
            unlocked: completedTasks >= 100,
            progress: Math.min(100, (completedTasks / 100) * 100)
        }
    ];
}

// Utility Functions
function createPieSegment(cx, cy, r, startAngle, endAngle, color) {
    const rad = Math.PI / 180;
    const x1 = cx + r * Math.cos(-startAngle * rad);
    const y1 = cy + r * Math.sin(-startAngle * rad);
    const x2 = cx + r * Math.cos(-endAngle * rad);
    const y2 = cy + r * Math.sin(-endAngle * rad);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `
        M ${cx},${cy}
        L ${x1},${y1}
        A ${r},${r} 0 ${endAngle - startAngle > 180 ? 1 : 0},0 ${x2},${y2}
        Z
    `);
    path.setAttribute('fill', color);
    
    return path;
}

function animateNumber(elementId, start, end) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const frames = 60;
    const increment = (end - start) / frames;
    let current = start;
    
    const animate = () => {
        current += increment;
        if (current >= end) {
            current = end;
        }
        element.textContent = Math.round(current);
        
        if (current < end) {
            requestAnimationFrame(animate);
        }
    };
    
    animate();
} 