// EduSummarizer Hub - Frontend JavaScript

const API_BASE = 'http://localhost:8000'; // Local backend URL for development

// Global variables for storing data
let currentText = '';
let currentSummary = '';
let currentQuiz = [];
let currentQuestionIndex = 0;
let userAnswers = [];

// Page transition functionality
function initializePageTransitions() {
    // Add transition class to body
    document.body.classList.add('page-transition');

    // Trigger fade-in after a short delay to ensure DOM is ready
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50);

    // Add fade-in-content class to main content areas
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('fade-in-content');
    }
}

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page transitions
    initializePageTransitions();

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const closeIcon = document.getElementById('close-icon');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            const isOpen = !mobileMenu.classList.contains('hidden');

            if (isOpen) {
                // Close menu
                mobileMenu.classList.add('hidden');
                hamburgerIcon.classList.remove('opacity-0');
                closeIcon.classList.add('opacity-0');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            } else {
                // Open menu
                mobileMenu.classList.remove('hidden');
                hamburgerIcon.classList.add('opacity-0');
                closeIcon.classList.remove('opacity-0');
                mobileMenuBtn.setAttribute('aria-expanded', 'true');
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!mobileMenuBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
            mobileMenu.classList.add('hidden');
            if (hamburgerIcon && closeIcon) {
                hamburgerIcon.classList.remove('opacity-0');
                closeIcon.classList.add('opacity-0');
            }
            if (mobileMenuBtn) {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Upload form handling
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }

    // Load summary if on summary page
    if (document.getElementById('summaryText')) {
        loadSummary();
    }

    // Load quiz if on quiz page
    if (document.getElementById('quizContainer')) {
        loadQuiz();
    }

    // Load dashboard data
    if (document.getElementById('totalSummaries')) {
        loadDashboard();
    }

    // Initialize drag-and-drop for file uploads
    initializeDragDrop();
});

async function handleUpload(e) {
    e.preventDefault();

    const fileInput = document.getElementById('file');
    const textInput = document.getElementById('text');
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');

    if (!fileInput.files[0] && !textInput.value.trim()) {
        alert('Please select a file or enter text');
        return;
    }

    submitBtn.disabled = true;
    loading.classList.remove('hidden');
    result.classList.add('hidden');

    try {
        let text = textInput.value.trim();

        if (fileInput.files[0]) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const response = await fetch(`${API_BASE}/upload/`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            text = data.content;
        }

        currentText = text;

        // Generate summary
        const summaryResponse = await fetch(`${API_BASE}/summarize/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (!summaryResponse.ok) throw new Error('Summary generation failed');

        const summaryData = await summaryResponse.json();
        currentSummary = summaryData.summary;

        // Store in localStorage for page navigation
        localStorage.setItem('currentText', currentText);
        localStorage.setItem('currentSummary', currentSummary);

        loading.classList.add('hidden');
        result.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
        loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

function loadSummary() {
    currentText = localStorage.getItem('currentText') || '';
    currentSummary = localStorage.getItem('currentSummary') || '';

    document.getElementById('originalText').textContent = currentText;
    document.getElementById('summaryText').textContent = currentSummary;

    // Translation functionality
    document.getElementById('translateBtn').addEventListener('click', handleTranslate);
}

async function handleTranslate() {
    const targetLang = document.getElementById('targetLang').value;
    const translatedDiv = document.getElementById('translatedText');

    try {
        const response = await fetch(`${API_BASE}/translate/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: currentSummary,
                target_language: targetLang
            })
        });

        if (!response.ok) throw new Error('Translation failed');

        const data = await response.json();
        translatedDiv.textContent = data.translated_text;
        translatedDiv.classList.remove('hidden');

    } catch (error) {
        console.error('Translation error:', error);
        alert('Translation failed. Please try again.');
    }
}

async function loadQuiz() {
    const summary = localStorage.getItem('currentSummary') || '';

    if (!summary) {
        alert('No summary available. Please upload content first.');
        window.location.href = 'upload.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/quiz/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: summary, num_questions: 5 })
        });

        if (!response.ok) throw new Error('Quiz generation failed');

        const data = await response.json();
        currentQuiz = data.questions;
        userAnswers = new Array(currentQuiz.length).fill(null);

        displayQuestion(0);

    } catch (error) {
        console.error('Quiz load error:', error);
        alert('Failed to load quiz. Please try again.');
    }
}

function displayQuestion(index) {
    const question = currentQuiz[index];
    document.getElementById('questionText').textContent = question.question;

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, optionIndex) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 transform hover:scale-105';
        optionDiv.textContent = option.text;
        optionDiv.onclick = () => selectOption(optionIndex);
        optionsContainer.appendChild(optionDiv);
    });

    updateNavigationButtons();
}

function selectOption(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;

    const options = document.querySelectorAll('.quiz-option');
    options.forEach((opt, idx) => {
        opt.classList.remove('selected', 'bg-blue-100', 'border-blue-500');
        if (idx === optionIndex) {
            opt.classList.add('selected', 'bg-blue-100', 'border-blue-500');
        }
    });
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.textContent = currentQuestionIndex === currentQuiz.length - 1 ? 'Finish' : 'Next';

    nextBtn.onclick = currentQuestionIndex === currentQuiz.length - 1 ? finishQuiz : nextQuestion;
    prevBtn.onclick = prevQuestion;
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
    }
}

function finishQuiz() {
    let score = 0;
    currentQuiz.forEach((question, index) => {
        const selectedOption = userAnswers[index];
        if (selectedOption !== null && question.options[selectedOption].is_correct) {
            score++;
        }
    });

    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('score').textContent = score;
    document.getElementById('total').textContent = currentQuiz.length;

    // Store quiz result
    const quizResult = { score, total: currentQuiz.length, date: new Date().toISOString() };
    localStorage.setItem('lastQuizResult', JSON.stringify(quizResult));
}

function loadDashboard() {
    // Load from localStorage (in a real app, this would come from backend)
    const lastQuiz = localStorage.getItem('lastQuizResult');
    if (lastQuiz) {
        const result = JSON.parse(lastQuiz);
        document.getElementById('totalQuizzes').textContent = '1';
        document.getElementById('avgScore').textContent = `${Math.round((result.score / result.total) * 100)}%`;

        const activityDiv = document.getElementById('recentActivity');
        activityDiv.innerHTML = `
            <div class="border-l-4 border-blue-500 pl-4">
                <p class="font-semibold">Quiz Completed</p>
                <p class="text-sm text-gray-600">Score: ${result.score}/${result.total} - ${new Date(result.date).toLocaleDateString()}</p>
            </div>
        `;
    }

    document.getElementById('totalSummaries').textContent = localStorage.getItem('currentSummary') ? '1' : '0';
}

// Drag and drop functionality for file uploads
function initializeDragDrop() {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('file');
    const dropZone = document.querySelector('.drop-zone');

    if (!dropZone) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            fileInput.files = files;
            // Trigger change event to update UI
            fileInput.dispatchEvent(new Event('change'));
        }
    }
}

// Enhanced error handling with better user feedback
function showError(message, type = 'error') {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    const errorDiv = document.createElement('div');
    errorDiv.className = `error-message p-4 rounded-md mb-4 ${type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-yellow-100 border border-yellow-400 text-yellow-700'}`;
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            ${message}
        </div>
    `;

    const form = document.getElementById('uploadForm');
    if (form) {
        form.insertBefore(errorDiv, form.firstChild);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Enhanced upload with progress bar
async function handleUpload(e) {
    e.preventDefault();

    const fileInput = document.getElementById('file');
    const textInput = document.getElementById('text');
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const progressBar = document.getElementById('progress-bar');

    if (!fileInput.files[0] && !textInput.value.trim()) {
        showError('Please select a file or enter text to process.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    loading.classList.remove('hidden');
    result.classList.add('hidden');

    // Reset progress bar
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
    }

    try {
        let text = textInput.value.trim();

        if (fileInput.files[0]) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const response = await fetch(`${API_BASE}/upload/`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'File upload failed. Please check the file format and try again.');
            }

            const data = await response.json();
            text = data.content;

        // Update progress
        if (progressBar) {
            progressBar.style.width = '30%';
        }
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = '30%';
        }
        }

        currentText = text;

        // Generate summary with progress
        if (progressBar) {
            progressBar.style.width = '60%';
        }
        if (progressText) {
            progressText.textContent = '60%';
        }

        const summaryResponse = await fetch(`${API_BASE}/summarize/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (!summaryResponse.ok) {
            const errorData = await summaryResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Summary generation failed. Please try again.');
        }

        const summaryData = await summaryResponse.json();
        currentSummary = summaryData.summary;

        // Complete progress
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        if (progressText) {
            progressText.textContent = '100%';
        }

        // Store in localStorage for page navigation
        localStorage.setItem('currentText', currentText);
        localStorage.setItem('currentSummary', currentSummary);

        loading.classList.add('hidden');
        result.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Process Content';

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        loading.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Process Content';

        // Reset progress on error
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
        }
    }
}

// Enhanced translation with loading state
async function handleTranslate() {
    const targetLang = document.getElementById('targetLang').value;
    const translatedDiv = document.getElementById('translatedText');
    const translateBtn = document.getElementById('translateBtn');

    // Show loading state
    translateBtn.disabled = true;
    translateBtn.innerHTML = `
        <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Translating...
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/translate/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: currentSummary,
                target_language: targetLang
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Translation failed. Please try again.');
        }

        const data = await response.json();
        translatedDiv.textContent = data.translated_text;
        translatedDiv.classList.remove('hidden');

    } catch (error) {
        console.error('Translation error:', error);
        showError(error.message, 'error');
    } finally {
        // Reset button
        translateBtn.disabled = false;
        translateBtn.innerHTML = 'Translate';
    }
}

// Enhanced quiz loading with loading state
async function loadQuiz() {
    const summary = localStorage.getItem('currentSummary') || '';
    const quizContainer = document.getElementById('quizContainer');

    if (!summary) {
        showError('No summary available. Please upload content first.');
        window.location.href = 'upload.html';
        return;
    }

    // Show loading state
    if (quizContainer) {
        quizContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-gray-600">Generating quiz questions...</p>
            </div>
        `;
    }

    try {
        const response = await fetch(`${API_BASE}/quiz/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: summary, num_questions: 5 })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Quiz generation failed. Please try again.');
        }

        const data = await response.json();
        currentQuiz = data.questions;
        userAnswers = new Array(currentQuiz.length).fill(null);

        displayQuestion(0);

    } catch (error) {
        console.error('Quiz load error:', error);
        showError(error.message);
        // Reset container
        if (quizContainer) {
            quizContainer.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-600 mb-4">Failed to load quiz. Please try again.</p>
                    <button onclick="loadQuiz()" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}
