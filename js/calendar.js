// Calendar State
let currentDate = new Date();
let currentView = 'month';
let selectedDate = null;
let draggedEvent = null;

// Calendar Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
    setupEventListeners();
});

function initializeCalendar() {
    updateCalendarHeader();
    renderCurrentView();
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));

    // View Toggles
    document.querySelectorAll('.view-toggle').forEach(button => {
        button.addEventListener('click', (e) => switchView(e.target.dataset.view));
    });

    // Event Form
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
}

// Calendar Navigation
function navigateMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateCalendarHeader();
    renderCurrentView();
}

function updateCalendarHeader() {
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('currentMonth').textContent = 
        currentDate.toLocaleDateString('en-US', options);
}

// View Switching
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-toggle').forEach(button => {
        button.classList.toggle('active', button.dataset.view === view);
    });
    document.querySelectorAll('.calendar-views > div').forEach(div => {
        div.classList.toggle('active', div.id === `${view}View`);
    });
    renderCurrentView();
}

// View Rendering
function renderCurrentView() {
    switch(currentView) {
        case 'month':
            renderMonthView();
            break;
        case 'week':
            renderWeekView();
            break;
        case 'day':
            renderDayView();
            break;
    }
}

// Month View
function renderMonthView() {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const calendarDays = document.querySelector('.calendar-days');
    let daysHTML = '';

    // Previous month padding
    for (let i = 0; i < startPadding; i++) {
        daysHTML += `<div class="calendar-day inactive"></div>`;
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const events = getEventsForDate(date);
        const isToday = isCurrentDate(date);
        
        daysHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${date.toISOString()}">
                <span class="day-number">${day}</span>
                <div class="day-events">
                    ${events.map(event => `
                        <div class="calendar-event" 
                             style="background-color: ${event.color}"
                             draggable="true"
                             data-event-id="${event.id}">
                            ${event.title}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calendarDays.innerHTML = daysHTML;
    setupDragAndDrop();
}

// Week View
function renderWeekView() {
    const weekStart = getWeekStart(currentDate);
    const weekDays = document.querySelector('.week-days');
    const timeColumn = document.querySelector('.time-column');
    
    // Render time slots
    let timeHTML = '';
    for (let hour = 0; hour < 24; hour++) {
        timeHTML += `
            <div class="time-slot">
                ${hour.toString().padStart(2, '0')}:00
            </div>
        `;
    }
    timeColumn.innerHTML = timeHTML;

    // Render week days
    let daysHTML = '';
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const events = getEventsForDate(date);
        
        daysHTML += `
            <div class="week-day" data-date="${date.toISOString()}">
                <div class="day-header">
                    ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div class="day-events">
                    ${events.map(event => `
                        <div class="calendar-event" 
                             style="background-color: ${event.color}; top: ${getEventTop(event)}px; height: ${getEventHeight(event)}px"
                             draggable="true"
                             data-event-id="${event.id}">
                            ${event.title}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    weekDays.innerHTML = daysHTML;
    setupDragAndDrop();
}

// Day View
function renderDayView() {
    const timeSlots = document.querySelector('.time-slots');
    const eventsColumn = document.querySelector('.events-column');
    const events = getEventsForDate(currentDate);

    // Render time slots
    let timeSlotsHTML = '';
    for (let hour = 0; hour < 24; hour++) {
        timeSlotsHTML += `
            <div class="time-slot">
                ${hour.toString().padStart(2, '0')}:00
            </div>
        `;
    }
    timeSlots.innerHTML = timeSlotsHTML;

    // Render events
    let eventsHTML = '';
    events.forEach(event => {
        eventsHTML += `
            <div class="calendar-event" 
                 style="background-color: ${event.color}; top: ${getEventTop(event)}px; height: ${getEventHeight(event)}px"
                 draggable="true"
                 data-event-id="${event.id}">
                ${event.title}
            </div>
        `;
    });
    eventsColumn.innerHTML = eventsHTML;
    setupDragAndDrop();
}

// Event Management
function getEventsForDate(date) {
    return AppUtils.AppState.events?.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
    }) || [];
}

function handleEventSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const eventData = {
        id: Date.now(),
        title: formData.get('eventTitle'),
        date: formData.get('eventDate'),
        time: formData.get('eventTime'),
        duration: parseInt(formData.get('eventDuration')),
        color: formData.get('eventColor')
    };

    AppUtils.AppState.events = AppUtils.AppState.events || [];
    AppUtils.AppState.events.push(eventData);
    saveToLocalStorage('events', AppUtils.AppState.events);
    
    closeEventModal();
    renderCurrentView();
    AppUtils.showNotification('Event added successfully!', 'success');
}

// Drag and Drop
function setupDragAndDrop() {
    const events = document.querySelectorAll('.calendar-event');
    const dropZones = document.querySelectorAll('.calendar-day, .week-day');

    events.forEach(event => {
        event.addEventListener('dragstart', handleDragStart);
        event.addEventListener('dragend', handleDragEnd);
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedEvent = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedEvent = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedEvent) return;

    const newDate = new Date(e.target.closest('[data-date]').dataset.date);
    const eventId = parseInt(draggedEvent.dataset.eventId);
    const eventIndex = AppUtils.AppState.events.findIndex(event => event.id === eventId);

    if (eventIndex !== -1) {
        AppUtils.AppState.events[eventIndex].date = newDate.toISOString();
        saveToLocalStorage('events', AppUtils.AppState.events);
        renderCurrentView();
        AppUtils.showNotification('Event rescheduled!', 'success');
    }
}

// Utility Functions
function getWeekStart(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return start;
}

function isCurrentDate(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function getEventTop(event) {
    const [hours, minutes] = event.time.split(':');
    return (parseInt(hours) * 60 + parseInt(minutes)) * (60 / 60);
}

function getEventHeight(event) {
    return event.duration * (60 / 60);
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    document.getElementById('eventForm').reset();
}

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = [];
        this.draggedEvent = null;
        this.subjects = [
            { id: 1, name: 'Mathematics', color: '#4a90e2' },
            { id: 2, name: 'Physics', color: '#e74c3c' },
            { id: 3, name: 'Chemistry', color: '#2ecc71' },
            { id: 4, name: 'Biology', color: '#f39c12' }
        ];

        this.initializeElements();
        this.setupEventListeners();
        this.loadEvents();
        this.renderCalendar();
        this.populateSubjects();
    }

    initializeElements() {
        // Calendar elements
        this.calendarDays = document.getElementById('calendarDays');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.eventsList = document.getElementById('eventsList');

        // Modal elements
        this.eventModal = document.getElementById('eventModal');
        this.eventForm = document.getElementById('eventForm');
        this.eventSubject = document.getElementById('eventSubject');
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));

        // Event handling
        document.getElementById('addEvent').addEventListener('click', () => this.showEventModal());
        document.getElementById('saveEvent').addEventListener('click', () => this.handleEventSubmit());
        document.getElementById('filterEvents').addEventListener('click', () => this.toggleFilterMenu());

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', () => this.closeEventModal());
        });

        // Calendar day click
        this.calendarDays.addEventListener('click', (e) => {
            const dayElement = e.target.closest('.calendar-day');
            if (dayElement && !dayElement.classList.contains('inactive')) {
                this.selectedDate = new Date(dayElement.dataset.date);
                this.showEventModal();
            }
        });

        // Drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        this.calendarDays.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('calendar-event')) {
                this.draggedEvent = e.target;
                e.target.classList.add('dragging');
            }
        });

        this.calendarDays.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('calendar-event')) {
                e.target.classList.remove('dragging');
                this.draggedEvent = null;
            }
        });

        this.calendarDays.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dayElement = e.target.closest('.calendar-day');
            if (dayElement && !dayElement.classList.contains('inactive')) {
                e.dataTransfer.dropEffect = 'move';
            }
        });

        this.calendarDays.addEventListener('drop', (e) => {
            e.preventDefault();
            const dayElement = e.target.closest('.calendar-day');
            if (dayElement && !dayElement.classList.contains('inactive') && this.draggedEvent) {
                const eventId = this.draggedEvent.dataset.eventId;
                const newDate = new Date(dayElement.dataset.date);
                this.updateEventDate(eventId, newDate);
            }
        });
    }

    navigateMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update header
        this.currentMonthElement.textContent = new Date(year, month)
            .toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        // Calculate dates
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const totalDays = lastDay.getDate();

        let calendarHTML = '';

        // Previous month padding
        for (let i = 0; i < startPadding; i++) {
            const prevDate = new Date(year, month, -i);
            calendarHTML += this.createDayElement(prevDate, true);
        }

        // Current month
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            calendarHTML += this.createDayElement(date, false);
        }

        // Next month padding
        const remainingDays = 42 - (startPadding + totalDays); // 42 = 6 rows × 7 days
        for (let i = 1; i <= remainingDays; i++) {
            const nextDate = new Date(year, month + 1, i);
            calendarHTML += this.createDayElement(nextDate, true);
        }

        this.calendarDays.innerHTML = calendarHTML;
        this.renderUpcomingEvents();
    }

    createDayElement(date, inactive) {
        const isToday = this.isSameDay(date, new Date());
        const events = this.getEventsForDate(date);
        
        return `
            <div class="calendar-day ${inactive ? 'inactive' : ''} ${isToday ? 'today' : ''}"
                 data-date="${date.toISOString()}"
                 ondrop="handleDrop(event)"
                 ondragover="handleDragOver(event)">
                <span class="day-number">${date.getDate()}</span>
                <div class="day-events">
                    ${events.map(event => this.createEventElement(event)).join('')}
                </div>
            </div>
        `;
    }

    createEventElement(event) {
        const subject = this.subjects.find(s => s.id === event.subjectId);
        return `
            <div class="calendar-event"
                 style="background-color: ${subject ? subject.color : event.color}"
                 draggable="true"
                 data-event-id="${event.id}">
                ${event.title}
            </div>
        `;
    }

    showEventModal(event = null) {
        this.eventModal.classList.add('active');
        document.getElementById('eventModalTitle').textContent = event ? 'Edit Event' : 'Add Event';
        
        if (event) {
            // Populate form with event data
            this.eventForm.elements.title.value = event.title;
            this.eventForm.elements.date.value = event.date.toISOString().split('T')[0];
            this.eventForm.elements.time.value = event.time;
            this.eventForm.elements.duration.value = event.duration;
            this.eventForm.elements.subject.value = event.subjectId;
            this.eventForm.elements.color.value = event.color;
            this.eventForm.elements.notes.value = event.notes || '';
        } else {
            // Clear form and set default date
            this.eventForm.reset();
            if (this.selectedDate) {
                this.eventForm.elements.date.value = this.selectedDate.toISOString().split('T')[0];
            }
        }
    }

    closeEventModal() {
        this.eventModal.classList.remove('active');
        this.eventForm.reset();
        this.selectedDate = null;
    }

    handleEventSubmit() {
        const formData = new FormData(this.eventForm);
        const eventData = {
            id: Date.now(),
            title: formData.get('title'),
            date: new Date(formData.get('date')),
            time: formData.get('time'),
            duration: parseInt(formData.get('duration')),
            subjectId: parseInt(formData.get('subject')),
            color: formData.get('color'),
            notes: formData.get('notes')
        };

        this.events.push(eventData);
        this.saveEvents();
        this.renderCalendar();
        this.closeEventModal();
        
        AppUtils.showNotification('Event added successfully!', 'success');
    }

    updateEventDate(eventId, newDate) {
        const event = this.events.find(e => e.id === parseInt(eventId));
        if (event) {
            event.date = newDate;
            this.saveEvents();
            this.renderCalendar();
            AppUtils.showNotification('Event updated successfully!', 'success');
        }
    }

    renderUpcomingEvents() {
        const today = new Date();
        const upcomingEvents = this.events
            .filter(event => event.date >= today)
            .sort((a, b) => a.date - b.date)
            .slice(0, 5);

        this.eventsList.innerHTML = upcomingEvents.map(event => `
            <div class="event-item">
                <div class="event-color" style="background-color: ${this.getEventColor(event)}"></div>
                <div class="event-details">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">
                        ${event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        at ${event.time}
                    </div>
                </div>
                <div class="event-actions">
                    <button class="btn-icon" onclick="calendar.editEvent(${event.id})" aria-label="Edit event">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn-icon" onclick="calendar.deleteEvent(${event.id})" aria-label="Delete event">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `).join('') || '<p class="text-muted">No upcoming events</p>';
    }

    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            this.showEventModal(event);
        }
    }

    deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveEvents();
            this.renderCalendar();
            AppUtils.showNotification('Event deleted successfully!', 'success');
        }
    }

    populateSubjects() {
        this.eventSubject.innerHTML = this.subjects.map(subject => `
            <option value="${subject.id}">${subject.name}</option>
        `).join('');
    }

    getEventsForDate(date) {
        return this.events.filter(event => this.isSameDay(event.date, date));
    }

    getEventColor(event) {
        const subject = this.subjects.find(s => s.id === event.subjectId);
        return subject ? subject.color : event.color;
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    loadEvents() {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            this.events = JSON.parse(savedEvents).map(event => ({
                ...event,
                date: new Date(event.date)
            }));
        }
    }

    saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    }

    toggleFilterMenu() {
        // Implement filter functionality
        console.log('Filter menu toggled');
    }
}

// Initialize calendar
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new Calendar();
}); 