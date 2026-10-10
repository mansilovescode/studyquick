/* =========================================================
   STUDYQUICK - COMPLETE JAVASCRIPT
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE = {
    tasks: "studyquick_tasks",
    exams: "studyquick_exams",
    notes: "studyquick_notes",
    subjects: "studyquick_subjects",
    profile: "studyquick_profile",
    notifications: "studyquick_notifications",
    dark: "studyquick_dark",
    streak: "studyquick_streak"
};


function loadData(key, fallback = []) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}


function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}


let tasks = loadData(STORAGE.tasks);
let exams = loadData(STORAGE.exams);
let notes = loadData(STORAGE.notes);
let subjects = loadData(STORAGE.subjects);

let profile = loadData(STORAGE.profile, {});

let notifications =
    loadData(STORAGE.notifications);

let selectedScheduleDate = new Date();

let timerInterval = null;

let timerSeconds = 25 * 60;

let timerRunning = false;


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function todayISO() {
    const d = new Date();

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {
    if (!dateString) return "";

    const d = new Date(dateString + "T00:00:00");

    return d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function daysUntil(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(dateString + "T00:00:00");
    target.setHours(0, 0, 0, 0);

    return Math.ceil(
        (target - today) / 86400000
    );
}


function showToast(message, type = "success") {

    const container = $("toastContainer");

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4200);
}


/* =========================================================
   PROFILE
   ========================================================= */

function updateProfileUI() {

    const name =
        profile.name || "Student";

    $("topProfileName").textContent = name;

    $("welcomeName").textContent = name;

    const initial =
        name.trim().charAt(0).toUpperCase() || "S";

    $("topAvatar").textContent = initial;

    $("profileAvatarPreview").textContent =
        initial;
}


function openProfile() {

    $("profileName").value =
        profile.name || "";

    $("profileEmail").value =
        profile.email || "";

    $("profileCourse").value =
        profile.course || "";

    $("profileCollege").value =
        profile.college || "";

    $("profileModal").classList.add("show");

    setTimeout(() => {
        $("profileName").focus();
    }, 100);
}


$("profileBtn").addEventListener(
    "click",
    openProfile
);


$("profileForm").addEventListener(
    "submit",
    function (e) {

        e.preventDefault();

        profile = {
            name: $("profileName").value.trim(),
            email: $("profileEmail").value.trim(),
            course: $("profileCourse").value.trim(),
            college: $("profileCollege").value.trim()
        };

        saveData(STORAGE.profile, profile);

        updateProfileUI();

        closeModal("profileModal");

        showToast(
            "Profile saved successfully."
        );

        addNotification(
            "Profile Updated",
            "Your StudyQuick profile was updated."
        );
    }
);


/* =========================================================
   MODAL SYSTEM
   ========================================================= */

function openModal(id) {
    const modal = $(id);

    if (modal) {
        modal.classList.add("show");
    }
}


function closeModal(id) {
    const modal = $(id);

    if (modal) {
        modal.classList.remove("show");
    }
}


document.querySelectorAll(
    "[data-close]"
).forEach(button => {

    button.addEventListener(
        "click",
        () => closeModal(
            button.dataset.close
        )
    );

});


document.querySelectorAll(
    ".modal-overlay"
).forEach(overlay => {

    overlay.addEventListener(
        "click",
        event => {

            if (event.target === overlay) {
                overlay.classList.remove("show");
            }

        }
    );

});


document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            document
                .querySelectorAll(".modal-overlay.show")
                .forEach(modal => {
                    modal.classList.remove("show");
                });

            $("notificationOverlay")
                .classList.remove("show");

        }

    }
);


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

const pageNames = {
    dashboard: [
        "Dashboard",
        "Your personal study command center"
    ],

    schedule: [
        "Schedule",
        "Organize your study sessions"
    ],

    tasks: [
        "Tasks",
        "Manage your study workload"
    ],

    exams: [
        "Exams",
        "Track upcoming examinations"
    ],

    progress: [
        "Progress",
        "Monitor your preparation"
    ],

    notes: [
        "Notes & Files",
        "Keep your study resources organized"
    ],

    focus: [
        "Focus Timer",
        "Work smarter with focused sessions"
    ]
};


function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active-page");
        });

    const page =
        $(`${pageName}Page`);

    if (page) {
        page.classList.add("active-page");
    }

    document
        .querySelectorAll(".nav-item[data-page]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === pageName
            );

        });

    const details =
        pageNames[pageName];

    if (details) {
        $("pageTitle").textContent =
            details[0];

        $("pageSubtitle").textContent =
            details[1];
    }

    $("sidebar").classList.remove("open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageName === "dashboard") {
        renderDashboard();
    }

    if (pageName === "tasks") {
        renderTasks();
    }

    if (pageName === "exams") {
        renderExams();
    }

    if (pageName === "notes") {
        renderNotes();
    }

    if (pageName === "progress") {
        renderProgress();
    }

    if (pageName === "schedule") {
        renderSchedule();
    }
}


document
    .querySelectorAll(".nav-item[data-page]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => showPage(
                button.dataset.page
            )
        );

    });


document
    .querySelectorAll("[data-page-link]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => showPage(
                button.dataset.pageLink
            )
        );

    });


$("mobileMenu").addEventListener(
    "click",
    () => {
        $("sidebar").classList.toggle("open");
    }
);


/* =========================================================
   DARK MODE
   ========================================================= */

function applyDarkMode() {

    const enabled =
        localStorage.getItem(
            STORAGE.dark
        ) === "true";

    document.body.classList.toggle(
        "dark",
        enabled
    );
}


$("darkModeBtn").addEventListener(
    "click",
    () => {

        const enabled =
            !document.body.classList.contains(
                "dark"
            );

        document.body.classList.toggle(
            "dark",
            enabled
        );

        localStorage.setItem(
            STORAGE.dark,
            enabled
        );

        showToast(
            enabled
                ? "Dark mode enabled."
                : "Light mode enabled."
        );

    }
);


/* =========================================================
   TASKS
   ========================================================= */

function openTaskModal() {

    $("taskForm").reset();

    $("taskDate").value =
        todayISO();

    openModal("taskModal");
}


$("taskAddBtn").addEventListener(
    "click",
    openTaskModal
);


$("quickAddBtn").addEventListener(
    "click",
    () => openModal("quickModal")
);


document
    .querySelectorAll("[data-action]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.action;

                if (action === "task") {
                    openTaskModal();
                }

                if (action === "exam") {
                    openExamModal();
                }

                if (action === "note") {
                    openNoteModal();
                }

                if (action === "focus") {
                    showPage("focus");
                }

            }
        );

    });


document
    .querySelectorAll("[data-quick]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closeModal("quickModal");

                const action =
                    button.dataset.quick;

                if (action === "task") {
                    openTaskModal();
                }

                if (action === "exam") {
                    openExamModal();
                }

                if (action === "note") {
                    openNoteModal();
                }

                if (action === "focus") {
                    showPage("focus");
                }

            }
        );

    });


$("taskForm").addEventListener(
    "submit",
    function (e) {

        e.preventDefault();

        const task = {

            id: Date.now(),

            name:
                $("taskName").value.trim(),

            subject:
                $("taskSubject").value.trim(),

            priority:
                $("taskPriority").value,

            date:
                $("taskDate").value,

            start:
                $("taskStart").value,

            end:
                $("taskEnd").value,

            completed: false,

            createdAt:
                new Date().toISOString()

        };

        tasks.push(task);

        saveData(
            STORAGE.tasks,
            tasks
        );

        closeModal("taskModal");

        renderAll();

        showToast(
            "Task added successfully."
        );

        addNotification(
            "New Task Added",
            `${task.name} has been added to your study plan.`
        );
    }
);


function toggleTask(id) {

    const task =
        tasks.find(t => t.id === id);

    if (!task) return;

    task.completed =
        !task.completed;

    saveData(
        STORAGE.tasks,
        tasks
    );

    renderAll();

    if (task.completed) {
        showToast(
            "Task completed! 🎉"
        );

        addNotification(
            "Task Completed",
            `Great work! You completed ${task.name}.`
        );
    }
}


function deleteTask(id) {

    tasks =
        tasks.filter(
            task => task.id !== id
        );

    saveData(
        STORAGE.tasks,
        tasks
    );

    renderAll();

    showToast(
        "Task deleted."
    );
}


function renderTasks() {

    const container =
        $("tasksList");

    const search =
        $("taskSearch")
            .value
            .toLowerCase();

    const status =
        $("taskStatusFilter").value;

    const priority =
        $("taskPriorityFilter").value;

    let filtered =
        tasks.filter(task => {

            const matchesSearch =
                task.name
                    .toLowerCase()
                    .includes(search) ||
                task.subject
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                status === "all" ||
                (status === "completed" &&
                    task.completed) ||
                (status === "pending" &&
                    !task.completed);

            const matchesPriority =
                priority === "all" ||
                task.priority === priority;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        });

    filtered.sort(
        (a, b) =>
            new Date(
                `${a.date}T${a.start || "00:00"}`
            ) -
            new Date(
                `${b.date}T${b.start || "00:00"}`
            )
    );

    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>📚</div>
                <h3>No tasks found</h3>
                <p>Add a task to your planner.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        filtered.map(task => {

            const time =
                task.start
                    ? `${task.start}${task.end ? " – " + task.end : ""}`
                    : "Time not set";

            return `
                <article class="item-card ${task.completed ? "completed" : ""}">

                    <div class="card-top">

                        <div>
                            <div class="card-title">
                                ${escapeHTML(task.name)}
                            </div>

                            <div class="card-subtitle">
                                ${escapeHTML(task.subject)}
                            </div>
                        </div>

                        <button
                            class="small-btn delete"
                            onclick="deleteTask(${task.id})">
                            🗑
                        </button>

                    </div>

                    <div class="card-meta">

                        <span class="badge ${task.priority}">
                            ${task.priority.toUpperCase()}
                        </span>

                        <span class="badge">
                            📅 ${formatDate(task.date)}
                        </span>

                        <span class="badge">
                            ⏰ ${escapeHTML(time)}
                        </span>

                    </div>

                    <div class="card-actions">

                        <button
                            class="small-btn"
                            onclick="toggleTask(${task.id})">
                            ${task.completed
                                ? "↩ Mark Pending"
                                : "✓ Complete"}
                        </button>

                    </div>

                </article>
            `;

        }).join("");
}


$("taskSearch").addEventListener(
    "input",
    renderTasks
);

$("taskStatusFilter").addEventListener(
    "change",
    renderTasks
);

$("taskPriorityFilter").addEventListener(
    "change",
    renderTasks
);


/* =========================================================
   EXAMS
   ========================================================= */

function openExamModal() {

    $("examForm").reset();

    openModal("examModal");
}


$("examAddBtn").addEventListener(
    "click",
    openExamModal
);


$("examForm").addEventListener(
    "submit",
    function (e) {

        e.preventDefault();

        const exam = {

            id: Date.now(),

            name:
                $("examName").value.trim(),

            date:
                $("examDate").value,

            time:
                $("examTime").value,

            progress:
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            $("examProgress").value
                        )
                    )
                )

        };

        exams.push(exam);

        saveData(
            STORAGE.exams,
            exams
        );

        closeModal("examModal");

        renderAll();

        showToast(
            "Exam added successfully."
        );

        addNotification(
            "Exam Added",
            `${exam.name} is scheduled for ${formatDate(exam.date)}.`
        );
    }
);


function deleteExam(id) {

    const exam =
        exams.find(e => e.id === id);

    exams =
        exams.filter(
            exam => exam.id !== id
        );

    saveData(
        STORAGE.exams,
        exams
    );

    renderAll();

    showToast(
        `${exam?.name || "Exam"} deleted.`
    );
}


function renderExams() {

    const container =
        $("examsList");

    const upcoming =
        [...exams]
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );

    if (!upcoming.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>🎓</div>
                <h3>No exams added</h3>
                <p>Add your upcoming examinations.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        upcoming.map(exam => {

            const days =
                daysUntil(exam.date);

            let countdown;

            if (days < 0) {
                countdown = "Completed";
            } else if (days === 0) {
                countdown = "Today";
            } else if (days === 1) {
                countdown = "Tomorrow";
            } else {
                countdown = `${days} days`;
            }

            return `
                <article class="item-card">

                    <div class="card-top">

                        <div>
                            <div class="card-title">
                                🎓 ${escapeHTML(exam.name)}
                            </div>

                            <div class="card-subtitle">
                                ${formatDate(exam.date)}
                                ${exam.time
                                    ? " • " + escapeHTML(exam.time)
                                    : ""}
                            </div>
                        </div>

                        <button
                            class="small-btn delete"
                            onclick="deleteExam(${exam.id})">
                            🗑 Delete
                        </button>

                    </div>

                    <div class="exam-countdown">

                        <div class="days-box">

                            <strong>
                                ${days >= 0 ? days : 0}
                            </strong>

                            <span>
                                ${days === 0
                                    ? "DAYS"
                                    : "DAYS LEFT"}
                            </span>

                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(countdown)}
                            </strong>

                            <p class="card-subtitle">
                                Keep preparing!
                            </p>
                        </div>

                    </div>

                    <div class="exam-progress">

                        <div class="subject-progress-header">
                            <strong>Preparation</strong>
                            <span>${exam.progress}%</span>
                        </div>

                        <div class="progress-track">

                            <div
                                class="progress-fill"
                                style="width:${exam.progress}%">
                            </div>

                        </div>

                    </div>

                </article>
            `;

        }).join("");
}


/* =========================================================
   NOTES + FILE MANAGER
   ========================================================= */

function openNoteModal() {

    $("noteForm").reset();

    $("selectedFileName").textContent =
        "PDF or document files";

    openModal("noteModal");
}


$("noteAddBtn").addEventListener(
    "click",
    openNoteModal
);


$("noteFile").addEventListener(
    "change",
    function () {

        const file =
            this.files[0];

        $("selectedFileName").textContent =
            file
                ? file.name
                : "PDF or document files";

    }
);


$("noteForm").addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();

        const file =
            $("noteFile").files[0];

        let fileData = null;

        /*
         * Small files are stored in browser storage.
         * This makes the mini-project work without a backend.
         */

        if (file) {

            if (
                file.size >
                4 * 1024 * 1024
            ) {

                showToast(
                    "For this browser demo, please use a file smaller than 4 MB.",
                    "error"
                );

                return;
            }

            fileData =
                await fileToDataURL(file);
        }

        const note = {

            id: Date.now(),

            title:
                $("noteTitle").value.trim(),

            subject:
                $("noteSubject").value.trim(),

            text:
                $("noteText").value.trim(),

            fileName:
                file
                    ? file.name
                    : "",

            fileType:
                file
                    ? file.type
                    : "",

            fileData,

            createdAt:
                new Date().toISOString()

        };

        notes.push(note);

        try {

            saveData(
                STORAGE.notes,
                notes
            );

        } catch {

            notes.pop();

            showToast(
                "File is too large for browser storage.",
                "error"
            );

            return;
        }

        closeModal("noteModal");

        renderAll();

        showToast(
            file
                ? "Note and file saved."
                : "Note saved successfully."
        );

        addNotification(
            "New Study Resource",
            `${note.title} was added to your resources.`
        );
    }
);


function fileToDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                () => resolve(
                    reader.result
                );

            reader.onerror =
                reject;

            reader.readAsDataURL(file);
        }
    );
}


function deleteNote(id) {

    notes =
        notes.filter(
            note => note.id !== id
        );

    saveData(
        STORAGE.notes,
        notes
    );

    renderNotes();

    showToast(
        "Resource deleted."
    );
}


function openFile(id) {

    const note =
        notes.find(
            note => note.id === id
        );

    if (
        !note ||
        !note.fileData
    ) {
        showToast(
            "No file attached.",
            "error"
        );

        return;
    }

    const newWindow =
        window.open();

    if (!newWindow) {

        showToast(
            "Please allow pop-ups to open the file.",
            "error"
        );

        return;
    }

    newWindow.document.write(`
        <title>${escapeHTML(note.fileName)}</title>

        <iframe
            src="${note.fileData}"
            style="
                width:100%;
                height:100vh;
                border:0;
            ">
        </iframe>
    `);
}


function downloadFile(id) {

    const note =
        notes.find(
            note => note.id === id
        );

    if (
        !note ||
        !note.fileData
    ) {
        return;
    }

    const link =
        document.createElement("a");

    link.href =
        note.fileData;

    link.download =
        note.fileName || "study-file";

    document.body.appendChild(link);

    link.click();

    link.remove();
}


function renderNotes() {

    const container =
        $("notesList");

    const search =
        $("noteSearch")
            .value
            .toLowerCase();

    const subject =
        $("noteSubjectFilter").value;

    const filtered =
        notes.filter(note => {

            const matchesSearch =
                note.title
                    .toLowerCase()
                    .includes(search) ||
                note.subject
                    .toLowerCase()
                    .includes(search) ||
                note.text
                    .toLowerCase()
                    .includes(search) ||
                note.fileName
                    .toLowerCase()
                    .includes(search);

            const matchesSubject =
                subject === "all" ||
                note.subject === subject;

            return (
                matchesSearch &&
                matchesSubject
            );
        });

    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>📝</div>
                <h3>No notes or files found</h3>
                <p>Add your study notes and subject PDFs.</p>
            </div>
        `;

        updateSubjectFilter();

        return;
    }

    container.innerHTML =
        filtered.map(note => {

            const shortText =
                note.text
                    ? escapeHTML(
                        note.text
                    ).substring(0, 180)
                    : "No written note.";

            return `
                <article class="item-card">

                    <div class="card-top">

                        <div>
                            <div class="card-title">
                                📝 ${escapeHTML(note.title)}
                            </div>

                            <div class="card-subtitle">
                                ${escapeHTML(note.subject)}
                            </div>
                        </div>

                        <button
                            class="small-btn delete"
                            onclick="deleteNote(${note.id})">
                            🗑
                        </button>

                    </div>

                    <p class="card-subtitle"
                       style="margin-top:15px">
                        ${shortText}
                    </p>

                    ${
                        note.fileData
                        ? `
                            <div class="file-info">

                                <div class="file-icon">
                                    ${
                                        note.fileType ===
                                        "application/pdf"
                                            ? "📕"
                                            : "📎"
                                    }
                                </div>

                                <div>
                                    <strong>
                                        ${escapeHTML(note.fileName)}
                                    </strong>

                                    <small>
                                        Attached study file
                                    </small>
                                </div>

                            </div>
                        `
                        : ""
                    }

                    <div class="card-actions">

                        ${
                            note.fileData
                            ? `
                                <button
                                    class="small-btn"
                                    onclick="openFile(${note.id})">
                                    👁 Open
                                </button>

                                <button
                                    class="small-btn"
                                    onclick="downloadFile(${note.id})">
                                    ⬇ Download
                                </button>
                            `
                            : ""
                        }

                    </div>

                </article>
            `;

        }).join("");

    updateSubjectFilter();
}


function updateSubjectFilter() {

    const select =
        $("noteSubjectFilter");

    const current =
        select.value;

    const subjectsFromNotes =
        [...new Set(
            notes.map(
                note => note.subject
            )
        )].filter(Boolean);

    select.innerHTML = `
        <option value="all">
            All Subjects
        </option>

        ${
            subjectsFromNotes.map(
                subject =>
                    `<option value="${escapeHTML(subject)}">
                        ${escapeHTML(subject)}
                    </option>`
            ).join("")
        }
    `;

    if (
        subjectsFromNotes.includes(current)
    ) {
        select.value = current;
    }
}


$("noteSearch").addEventListener(
    "input",
    renderNotes
);

$("noteSubjectFilter").addEventListener(
    "change",
    renderNotes
);


/* =========================================================
   SUBJECTS + PROGRESS
   ========================================================= */

$("subjectAddBtn").addEventListener(
    "click",
    () => openModal("subjectModal")
);


$("subjectForm").addEventListener(
    "submit",
    function (e) {

        e.preventDefault();

        const name =
            $("subjectName")
                .value
                .trim();

        const percent =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        $("subjectPercent")
                            .value
                    )
                )
            );

        subjects.push({
            id: Date.now(),
            name,
            percent
        });

        saveData(
            STORAGE.subjects,
            subjects
        );

        closeModal("subjectModal");

        renderProgress();

        showToast(
            `${name} added.`
        );
    }
);


function deleteSubject(id) {

    subjects =
        subjects.filter(
            subject =>
                subject.id !== id
        );

    saveData(
        STORAGE.subjects,
        subjects
    );

    renderProgress();

    showToast(
        "Subject removed."
    );
}


function renderProgress() {

    const list =
        $("subjectProgressList");

    if (!subjects.length) {

        list.innerHTML = `
            <div class="empty-state">
                <div>📊</div>
                <h3>No subjects yet</h3>
                <p>Add subjects to track your progress.</p>
            </div>
        `;

    } else {

        list.innerHTML =
            subjects.map(subject => {

                return `
                    <div class="subject-progress">

                        <div class="subject-progress-header">

                            <strong>
                                ${escapeHTML(subject.name)}
                            </strong>

                            <span>
                                ${subject.percent}%
                            </span>

                        </div>

                        <div class="progress-track">

                            <div
                                class="progress-fill"
                                style="width:${subject.percent}%">
                            </div>

                        </div>

                        <div class="card-actions">

                            <button
                                class="small-btn delete"
                                onclick="deleteSubject(${subject.id})">
                                🗑 Remove
                            </button>

                        </div>

                    </div>
                `;

            }).join("");
    }

    const overall =
        subjects.length
            ? Math.round(
                subjects.reduce(
                    (sum, s) =>
                        sum + Number(s.percent),
                    0
                ) / subjects.length
            )
            : 0;

    const circle =
        $("overallProgress");

    circle.style.background =
        `conic-gradient(
            var(--primary) ${overall * 3.6}deg,
            var(--border) ${overall * 3.6}deg
        )`;

    circle.querySelector(
        "span"
    ).textContent =
        `${overall}%`;
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

    const today =
        todayISO();

    const todayTasks =
        tasks.filter(
            task => task.date === today
        );

    $("statTasks").textContent =
        todayTasks.length;

    const completed =
        tasks.length
            ? Math.round(
                tasks.filter(
                    task => task.completed
                ).length /
                tasks.length *
                100
            )
            : 0;

    $("statCompleted").textContent =
        `${completed}%`;

    const upcomingExams =
        exams.filter(
            exam =>
                daysUntil(exam.date) >= 0
        );

    $("statExams").textContent =
        upcomingExams.length;

    $("statStreak").textContent =
        `${getStreak()} Days`;

    renderTodayTasks();

    renderNextExam();

    renderWeeklyChart();

    updateGreeting();
}


function renderTodayTasks() {

    const container =
        $("todayTasks");

    const today =
        todayISO();

    const list =
        tasks.filter(
            task => task.date === today
        );

    if (!list.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>📚</div>
                <h3>No tasks for today</h3>
                <p>Add a task to start planning.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        list.map(task => {

            return `
                <div class="schedule-item">

                    <div class="schedule-time">
                        ${escapeHTML(
                            task.start || "--:--"
                        )}
                    </div>

                    <div class="schedule-content">

                        <strong>
                            ${escapeHTML(task.name)}
                        </strong>

                        <span>
                            ${escapeHTML(task.subject)}
                        </span>

                    </div>

                    <button
                        class="small-btn"
                        onclick="toggleTask(${task.id})">
                        ${task.completed
                            ? "✓"
                            : "○"}
                    </button>

                </div>
            `;

        }).join("");
}


function renderNextExam() {

    const container =
        $("nextExamContainer");

    const upcoming =
        exams
            .filter(
                exam =>
                    daysUntil(exam.date) >= 0
            )
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );

    if (!upcoming.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>🎓</div>
                <h3>No upcoming exams</h3>
                <p>Add your first exam.</p>
            </div>
        `;

        return;
    }

    const exam =
        upcoming[0];

    const days =
        daysUntil(exam.date);

    container.innerHTML = `

        <div class="exam-countdown">

            <div class="days-box">

                <strong>
                    ${days}
                </strong>

                <span>
                    DAYS
                </span>

            </div>

            <div>

                <strong>
                    ${escapeHTML(exam.name)}
                </strong>

                <p class="card-subtitle">
                    ${formatDate(exam.date)}
                </p>

            </div>

        </div>

        <div class="exam-progress">

            <div class="subject-progress-header">
                <strong>Preparation</strong>
                <span>${exam.progress}%</span>
            </div>

            <div class="progress-track">

                <div
                    class="progress-fill"
                    style="width:${exam.progress}%">
                </div>

            </div>

        </div>
    `;
}


function renderWeeklyChart() {

    const container =
        $("weeklyChart");

    const days = [];

    const now =
        new Date();

    for (let i = 6; i >= 0; i--) {

        const date =
            new Date(now);

        date.setDate(
            now.getDate() - i
        );

        const iso =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}-${String(
                date.getDate()
            ).padStart(2, "0")}`;

        const count =
            tasks.filter(
                task =>
                    task.date === iso &&
                    task.completed
            ).length;

        days.push({
            name:
                date.toLocaleDateString(
                    undefined,
                    { weekday: "short" }
                ),

            count
        });
    }

    const max =
        Math.max(
            ...days.map(
                day => day.count
            ),
            1
        );

    container.innerHTML =
        days.map(day => {

            const height =
                Math.max(
                    5,
                    day.count / max * 100
                );

            return `
                <div class="chart-column">

                    <div class="chart-bar-wrap">

                        <div
                            class="chart-bar"
                            style="height:${height}%"
                            title="${day.count} completed">
                        </div>

                    </div>

                    <span>
                        ${day.name}
                    </span>

                </div>
            `;

        }).join("");
}


function updateGreeting() {

    const hour =
        new Date().getHours();

    let greeting =
        "day";

    if (hour < 12) {
        greeting = "morning";
    } else if (hour < 18) {
        greeting = "afternoon";
    } else {
        greeting = "evening";
    }

    $("greetingTime").textContent =
        greeting;
}


/* =========================================================
   SCHEDULE
   ========================================================= */

$("scheduleAddBtn").addEventListener(
    "click",
    openTaskModal
);


$("prevDay").addEventListener(
    "click",
    () => {

        selectedScheduleDate.setDate(
            selectedScheduleDate.getDate() - 1
        );

        renderSchedule();
    }
);


$("nextDay").addEventListener(
    "click",
    () => {

        selectedScheduleDate.setDate(
            selectedScheduleDate.getDate() + 1
        );

        renderSchedule();
    }
);


$("todaySchedule").addEventListener(
    "click",
    () => {

        selectedScheduleDate =
            new Date();

        renderSchedule();
    }
);


function renderSchedule() {

    const date =
        selectedScheduleDate;

    const iso =
        `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-${String(
            date.getDate()
        ).padStart(2, "0")}`;

    $("scheduleDate").textContent =
        date.toLocaleDateString(
            undefined,
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );

    const list =
        tasks
            .filter(
                task =>
                    task.date === iso
            )
            .sort(
                (a, b) =>
                    (a.start || "")
                        .localeCompare(
                            b.start || ""
                        )
            );

    if (!list.length) {

        $("scheduleList").innerHTML = `
            <div class="empty-state">
                <div>📅</div>
                <h3>No scheduled tasks</h3>
                <p>Add a study task for this day.</p>
            </div>
        `;

        return;
    }

    $("scheduleList").innerHTML =
        list.map(task => {

            return `
                <div class="schedule-item">

                    <div class="schedule-time">
                        ${escapeHTML(
                            task.start || "--:--"
                        )}
                    </div>

                    <div class="schedule-content">

                        <strong>
                            ${escapeHTML(task.name)}
                        </strong>

                        <span>
                            ${escapeHTML(task.subject)}
                            ${
                                task.end
                                    ? ` • ${escapeHTML(task.end)}`
                                    : ""
                            }
                        </span>

                    </div>

                    <button
                        class="small-btn"
                        onclick="toggleTask(${task.id})">
                        ${task.completed
                            ? "✓ Done"
                            : "○ Pending"}
                    </button>

                </div>
            `;

        }).join("");
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function addNotification(
    title,
    message
) {

    notifications.unshift({

        id: Date.now(),

        title,

        message,

        time:
            new Date().toISOString(),

        unread: true

    });

    notifications =
        notifications.slice(0, 30);

    saveData(
        STORAGE.notifications,
        notifications
    );

    renderNotifications();
}


function renderNotifications() {

    const container =
        $("notificationsList");

    const unread =
        notifications.filter(
            n => n.unread
        ).length;

    $("notificationCount").textContent =
        unread;

    if (!notifications.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>🔔</div>
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        notifications.map(n => {

            return `
                <div
                    class="notification-item ${
                        n.unread
                            ? "unread"
                            : ""
                    }">

                    <div>🔔</div>

                    <div>

                        <strong>
                            ${escapeHTML(n.title)}
                        </strong>

                        <p>
                            ${escapeHTML(n.message)}
                        </p>

                        <small>
                            ${new Date(
                                n.time
                            ).toLocaleString()}
                        </small>

                    </div>

                </div>
            `;

        }).join("");
}


$("notificationBtn").addEventListener(
    "click",
    () => {

        notifications =
            notifications.map(
                n => ({
                    ...n,
                    unread: false
                })
            );

        saveData(
            STORAGE.notifications,
            notifications
        );

        renderNotifications();

        $("notificationOverlay")
            .classList.add("show");
    }
);


$("closeNotifications")
    .addEventListener(
        "click",
        () => {

            $("notificationOverlay")
                .classList.remove("show");

        }
    );


$("notificationOverlay")
    .addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("notificationOverlay")
            ) {

                $("notificationOverlay")
                    .classList.remove("show");

            }

        }
    );


$("clearNotifications")
    .addEventListener(
        "click",
        () => {

            notifications = [];

            saveData(
                STORAGE.notifications,
                notifications
            );

            renderNotifications();

            showToast(
                "Notifications cleared."
            );

        }
    );


/* =========================================================
   STREAK
   ========================================================= */

function getStreak() {

    const completedDates =
        [
            ...new Set(
                tasks
                    .filter(
                        task =>
                            task.completed
                    )
                    .map(
                        task =>
                            task.date
                    )
            )
        ]
        .sort()
        .reverse();

    if (!completedDates.length) {
        return 0;
    }

    let streak = 0;

    let current =
        new Date();

    current.setHours(
        0, 0, 0, 0
    );

    /*
     * Allow today or yesterday
     * as the beginning of a streak.
     */

    const today =
        todayISO();

    if (
        !completedDates.includes(today)
    ) {

        current.setDate(
            current.getDate() - 1
        );

    }

    while (true) {

        const iso =
            `${current.getFullYear()}-${String(
                current.getMonth() + 1
            ).padStart(2, "0")}-${String(
                current.getDate()
            ).padStart(2, "0")}`;

        if (
            completedDates.includes(iso)
        ) {

            streak++;

            current.setDate(
                current.getDate() - 1
            );

        } else {

            break;

        }

    }

    return streak;
}


/* =========================================================
   POMODORO
   ========================================================= */

function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timerSeconds / 60
        );

    const seconds =
        timerSeconds % 60;

    $("timerDisplay").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


function setTimer(minutes) {

    clearInterval(timerInterval);

    timerRunning = false;

    timerSeconds =
        minutes * 60;

    $("timerStart").textContent =
        "▶ Start";

    updateTimerDisplay();
}


document
    .querySelectorAll(".timer-mode-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".timer-mode-btn"
                    )
                    .forEach(
                        b =>
                            b.classList.remove(
                                "active"
                            )
                    );

                button.classList.add(
                    "active"
                );

                setTimer(
                    Number(
                        button.dataset.minutes
                    )
                );

            }
        );

    });


$("timerStart").addEventListener(
    "click",
    () => {

        if (timerRunning) {

            clearInterval(
                timerInterval
            );

            timerRunning = false;

            $("timerStart")
                .textContent =
                "▶ Resume";

            return;
        }

        timerRunning = true;

        $("timerStart")
            .textContent =
            "⏸ Pause";

        timerInterval =
            setInterval(
                () => {

                    if (
                        timerSeconds <= 0
                    ) {

                        clearInterval(
                            timerInterval
                        );

                        timerRunning =
                            false;

                        $("timerStart")
                            .textContent =
                            "▶ Start";

                        showToast(
                            "Focus session complete! 🎉"
                        );

                        addNotification(
                            "Focus Session Complete",
                            "Great job! Take a short break."
                        );

                        return;
                    }

                    timerSeconds--;

                    updateTimerDisplay();

                },
                1000
            );

    }
);


$("timerReset").addEventListener(
    "click",
    () => {

        const active =
            document.querySelector(
                ".timer-mode-btn.active"
            );

        setTimer(
            Number(
                active?.dataset.minutes ||
                25
            )
        );

    }
);


/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

$("globalSearchBtn").addEventListener(
    "click",
    () => {

        showPage("tasks");

        setTimeout(
            () => $("taskSearch").focus(),
            200
        );

    }
);


/* =========================================================
   SETTINGS
   ========================================================= */

$("settingsBtn").addEventListener(
    "click",
    () => {

        openProfile();

    }
);


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const tag =
            document.activeElement?.tagName;

        const typing =
            tag === "INPUT" ||
            tag === "TEXTAREA" ||
            tag === "SELECT";

        if (typing) return;

        if (
            event.key.toLowerCase() === "a"
        ) {

            event.preventDefault();

            openTaskModal();

        }

        if (
            event.key.toLowerCase() === "f"
        ) {

            event.preventDefault();

            showPage("focus");

        }

        if (
            event.key === "/"
        ) {

            event.preventDefault();

            showPage("tasks");

            setTimeout(
                () =>
                    $("taskSearch").focus(),
                100
            );

        }

    }
);


/* =========================================================
   AUTO NOTIFICATIONS
   ========================================================= */

function generateAutomaticNotifications() {

    const today =
        todayISO();

    const todaysTasks =
        tasks.filter(
            task =>
                task.date === today &&
                !task.completed
        );

    if (todaysTasks.length) {

        const already =
            notifications.some(
                n =>
                    n.title ===
                    "Today's Study Plan"
            );

        if (!already) {

            addNotification(
                "Today's Study Plan",
                `You have ${todaysTasks.length} pending task(s) today.`
            );

        }

    }

    const nextExam =
        exams
            .filter(
                exam =>
                    daysUntil(exam.date) >= 0
            )
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            )[0];

    if (nextExam) {

        const days =
            daysUntil(nextExam.date);

        if (days <= 7) {

            const already =
                notifications.some(
                    n =>
                        n.title ===
                        "Exam Reminder" &&
                        n.message.includes(
                            nextExam.name
                        )
                );

            if (!already) {

                addNotification(
                    "Exam Reminder",
                    `${nextExam.name} is ${days === 0
                        ? "today"
                        : `in ${days} day(s)`}.`
                );

            }

        }

    }
}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {

    updateProfileUI();

    renderDashboard();

    renderTasks();

    renderExams();

    renderNotes();

    renderProgress();

    renderSchedule();

    renderNotifications();
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initialize() {

    applyDarkMode();

    updateProfileUI();

    updateTimerDisplay();

    renderAll();

    setTimeout(
        generateAutomaticNotifications,
        500
    );

}


initialize();