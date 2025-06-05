// Study Plan State
let topicCounter = 0;
let currentPlan = null;

// Initialize Study Plan Page
document.addEventListener('DOMContentLoaded', () => {
    initializeFormSections();
    setupEventListeners();
    loadExistingPlan();
});

// Initialize Collapsible Form Sections
function initializeFormSections() {
    document.querySelectorAll('.toggle-section').forEach(button => {
        const sectionId = button.dataset.section;
        const section = document.getElementById(sectionId);
        const icon = button.querySelector('.material-icons');

        button.addEventListener('click', () => {
            section.classList.toggle('collapsed');
            icon.textContent = section.classList.contains('collapsed') ? 'expand_more' : 'expand_less';
        });
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Add Topic Button
    const addTopicBtn = document.getElementById('addTopic');
    if (addTopicBtn) {
        addTopicBtn.addEventListener('click', addNewTopic);
    }

    // Form Submission
    const planForm = document.getElementById('studyPlanForm');
    if (planForm) {
        planForm.addEventListener('submit', handlePlanSubmission);
    }

    // Export Plan Button
    const exportBtn = document.getElementById('exportPlan');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportPlan);
    }

    // Share Plan Button
    const shareBtn = document.getElementById('sharePlan');
    if (shareBtn) {
        shareBtn.addEventListener('click', sharePlan);
    }

    // Topics Container Event Delegation
    const topicsContainer = document.getElementById('topicsContainer');
    if (topicsContainer) {
        topicsContainer.addEventListener('click', handleTopicContainerClick);
    }
}

// Handle Topic Container Click Events
function handleTopicContainerClick(e) {
    const removeBtn = e.target.closest('.remove-topic');
    if (removeBtn) {
        const topicItem = removeBtn.closest('.topic-item');
        if (topicItem) {
            topicItem.classList.add('fade-out');
            setTimeout(() => topicItem.remove(), 300);
        }
    }
}

// Add New Topic
function addNewTopic() {
    const template = document.getElementById('topicTemplate');
    const topicsContainer = document.getElementById('topicsContainer');
    
    if (template && topicsContainer) {
        const newTopic = template.content.cloneNode(true);
        const topicItem = document.createElement('div');
        topicItem.className = 'topic-item slide-in';
        
        // Add unique IDs to inputs
        const topicId = `topic-${++topicCounter}`;
        const nameInput = newTopic.querySelector('.topic-name');
        const hoursInput = newTopic.querySelector('.topic-hours');
        
        if (nameInput && hoursInput) {
            nameInput.id = `${topicId}-name`;
            hoursInput.id = `${topicId}-hours`;
        }

        topicItem.appendChild(newTopic);
        topicsContainer.appendChild(topicItem);

        // Remove animation class after animation completes
        setTimeout(() => topicItem.classList.remove('slide-in'), 300);
    }
}

// Handle Plan Submission
async function handlePlanSubmission(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('generatePlan');
    if (!submitButton) return;

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-spinner"></span> Generating...';

    try {
        const planData = collectFormData();
        if (!validatePlanData(planData)) {
            throw new Error('Please fill in all required fields');
        }

        const generatedPlan = await generateStudyPlan(planData);
        currentPlan = generatedPlan;
        
        await savePlan(generatedPlan);
        renderPlan(generatedPlan);
        
        showNotification('Study plan generated successfully!', 'success');
    } catch (error) {
        console.error('Error generating study plan:', error);
        showNotification(error.message || 'Error generating study plan', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons">auto_awesome</span> Generate Study Plan';
    }
}

// Collect Form Data
function collectFormData() {
    const examSubject = document.getElementById('examSubject')?.value;
    const examDate = document.getElementById('examDate')?.value;
    const examDifficulty = document.getElementById('examDifficulty')?.value;
    const studyHoursPerDay = parseInt(document.getElementById('studyHoursPerDay')?.value);
    const breakDuration = parseInt(document.getElementById('breakDuration')?.value);

    const preferredDays = Array.from(document.querySelectorAll('.weekday-selector input:checked'))
        .map(input => parseInt(input.value));

    const topics = Array.from(document.querySelectorAll('.topic-item')).map(topic => ({
        name: topic.querySelector('.topic-name').value,
        hoursNeeded: parseInt(topic.querySelector('.topic-hours').value)
    }));

    return {
        exam: { subject: examSubject, date: examDate, difficulty: examDifficulty },
        schedule: { preferredDays, hoursPerDay: studyHoursPerDay, breakDuration },
        topics
    };
}

// Validate Plan Data
function validatePlanData(data) {
    if (!data.exam.subject || !data.exam.date || !data.exam.difficulty) {
        showNotification('Please fill in all exam details', 'error');
        return false;
    }

    if (data.topics.length === 0) {
        showNotification('Please add at least one topic', 'error');
        return false;
    }

    if (data.schedule.preferredDays.length === 0) {
        showNotification('Please select at least one preferred study day', 'error');
        return false;
    }

    return true;
}

// Generate Study Plan
async function generateStudyPlan(planData) {
    const totalHours = planData.topics.reduce((sum, topic) => sum + topic.hoursNeeded, 0);
    const daysUntilExam = Math.ceil((new Date(planData.exam.date) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExam <= 0) {
        throw new Error('Exam date must be in the future');
    }

    const schedule = [];
    let currentDate = new Date();
    let remainingTopics = [...planData.topics];
    let dayCount = 0;

    while (remainingTopics.length > 0 && dayCount < daysUntilExam) {
        if (planData.schedule.preferredDays.includes(currentDate.getDay())) {
            const daySchedule = {
                date: new Date(currentDate),
                sessions: []
            };

            let remainingHours = planData.schedule.hoursPerDay;
            while (remainingHours > 0 && remainingTopics.length > 0) {
                const topic = remainingTopics[0];
                const sessionHours = Math.min(remainingHours, topic.hoursNeeded);

                daySchedule.sessions.push({
                    topic: topic.name,
                    duration: sessionHours,
                    breakDuration: planData.schedule.breakDuration
                });

                topic.hoursNeeded -= sessionHours;
                remainingHours -= sessionHours;

                if (topic.hoursNeeded <= 0) {
                    remainingTopics.shift();
                }
            }

            schedule.push(daySchedule);
            dayCount++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        exam: planData.exam,
        schedule,
        totalHours,
        completedHours: 0
    };
}

// Render Plan
function renderPlan(plan) {
    const timeline = document.getElementById('planTimeline');
    if (!timeline) return;

    timeline.innerHTML = '';

    plan.schedule.forEach((day, index) => {
        const dayElement = document.createElement('div');
        dayElement.className = 'timeline-day slide-in';
        dayElement.style.animationDelay = `${index * 0.1}s`;

        const date = new Date(day.date);
        dayElement.innerHTML = `
            <div class="day-header">
                <h4>${formatDate(date)}</h4>
                <span class="day-name">${getDayName(date)}</span>
            </div>
            <div class="day-sessions">
                ${day.sessions.map(session => `
                    <div class="session-item">
                        <span class="material-icons">book</span>
                        <div class="session-details">
                            <h5>${session.topic}</h5>
                            <p>${session.duration} hour${session.duration !== 1 ? 's' : ''}</p>
                            <p class="break-time">Break: ${session.breakDuration} minutes</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        timeline.appendChild(dayElement);
    });

    // Scroll to the plan
    document.querySelector('.generated-plan').scrollIntoView({ behavior: 'smooth' });
}

// Helper Functions
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    }).format(date);
}

function getDayName(date) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
}

function showNotification(message, type = 'info') {
    // Assuming we have a notification system in place
    if (window.AppUtils && AppUtils.showNotification) {
        AppUtils.showNotification(message, type);
    } else {
        alert(message);
    }
}

// Export and Share Functions
function exportPlan() {
    if (!currentPlan) {
        showNotification('No plan to export', 'error');
        return;
    }

    const dataStr = JSON.stringify(currentPlan, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportName = `study-plan-${formatDate(new Date())}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
}

function sharePlan() {
    if (!currentPlan) {
        showNotification('No plan to share', 'error');
        return;
    }

    if (navigator.share) {
        navigator.share({
            title: 'My Study Plan',
            text: `Study Plan for ${currentPlan.exam.subject}`,
            url: window.location.href
        }).catch(console.error);
    } else {
        showNotification('Sharing is not supported on this device', 'error');
    }
}

// Storage Functions
async function savePlan(plan) {
    try {
        localStorage.setItem('currentStudyPlan', JSON.stringify(plan));
    } catch (error) {
        console.error('Error saving plan:', error);
    }
}

function loadExistingPlan() {
    try {
        const savedPlan = localStorage.getItem('currentStudyPlan');
        if (savedPlan) {
            currentPlan = JSON.parse(savedPlan);
            renderPlan(currentPlan);
        }
    } catch (error) {
        console.error('Error loading saved plan:', error);
    }
} 