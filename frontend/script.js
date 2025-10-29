// EduSummarizer Hub - Frontend JavaScript

const API_BASE = 'http://localhost:8000'; // Local backend URL for development

// Global variables for storing data
let currentText = '';
let currentSummary = '';
let currentQuiz = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let currentUser = null;
let authToken = null;

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
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

    // Auth forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // OAuth buttons
    const googleLoginBtn = document.getElementById('googleLogin');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }

    const githubLoginBtn = document.getElementById('githubLogin');
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', handleGithubLogin);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Check if user is logged in
    checkAuthStatus();
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

            const headers = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch(`${API_BASE}/upload/`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            text = data.content;
        }

        currentText = text;

        // Generate summary
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        const summaryResponse = await fetch(`${API_BASE}/summarize/`, {
            method: 'POST',
            headers: headers,
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
        optionDiv.className = 'quiz-option p-3 border border-gray-300 rounded-md cursor-pointer';
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
        opt.classList.remove('selected');
        if (idx === optionIndex) opt.classList.add('selected');
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

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    const message = document.getElementById('message');

    btn.disabled = true;
    message.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            await checkAuthStatus();
            window.location.href = 'index.html';
        } else {
            message.textContent = data.detail || 'Login failed';
            message.classList.remove('hidden');
        }
    } catch (error) {
        message.textContent = 'Network error. Please try again.';
        message.classList.remove('hidden');
    } finally {
        btn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('signupBtn');
    const message = document.getElementById('message');

    btn.disabled = true;
    message.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            await checkAuthStatus();
            window.location.href = 'index.html';
        } else {
            message.textContent = data.detail || 'Signup failed';
            message.classList.remove('hidden');
        }
    } catch (error) {
        message.textContent = 'Network error. Please try again.';
        message.classList.remove('hidden');
    } finally {
        btn.disabled = false;
    }
}

async function handleGoogleLogin() {
    try {
        const response = await fetch(`${API_BASE}/auth/google/login`);
        const data = await response.json();
        if (data.authorization_url) {
            window.location.href = data.authorization_url;
        }
    } catch (error) {
        alert('Google login failed. Please try again.');
    }
}

async function handleGithubLogin() {
    try {
        const response = await fetch(`${API_BASE}/auth/github/login`);
        const data = await response.json();
        if (data.authorization_url) {
            window.location.href = data.authorization_url;
        }
    } catch (error) {
        alert('GitHub login failed. Please try again.');
    }
}

async function checkAuthStatus() {
    authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            currentUser = await response.json();
            updateUIForLoggedInUser();
        } else {
            localStorage.removeItem('authToken');
            authToken = null;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

function updateUIForLoggedInUser() {
    const authLinks = document.getElementById('auth-links');
    const userInfo = document.getElementById('user-info');
    const userTier = document.getElementById('user-tier');

    if (authLinks && userInfo && userTier) {
        authLinks.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userTier.textContent = currentUser.tier.toUpperCase();
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    location.reload();
}
