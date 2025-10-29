// tutorial.js - In-app tutorial for new users
document.addEventListener('DOMContentLoaded', function() {
    const tutorialKey = 'edusummarizer_tutorial_shown';
    const hasSeenTutorial = localStorage.getItem(tutorialKey);

    if (!hasSeenTutorial) {
        showTutorial();
        localStorage.setItem(tutorialKey, 'true');
    }
});

function showTutorial() {
    const steps = [
        {
            title: "Welcome to EduSummarizer Hub!",
            content: "Let's take a quick tour to get you started with our AI-powered tools.",
            target: "nav"
        },
        {
            title: "Upload Your Content",
            content: "Click here to upload files or paste text for summarization and quizzes.",
            target: "a[href='upload.html']"
        },
        {
            title: "View Your Dashboard",
            content: "Track your progress, summaries created, and quiz scores here.",
            target: "a[href='dashboard.html']"
        },
        {
            title: "Free Tier Available",
            content: "Start with 10 free summaries per month. Upgrade anytime for unlimited access!",
            target: "main"
        }
    ];

    let currentStep = 0;

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        overlay.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
                <h3 class="text-xl font-bold mb-4" id="tutorial-title"></h3>
                <p class="text-gray-600 mb-6" id="tutorial-content"></p>
                <div class="flex justify-between">
                    <button id="tutorial-prev" class="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50">Previous</button>
                    <div class="text-sm text-gray-500 self-center">${currentStep + 1} of ${steps.length}</div>
                    <button id="tutorial-next" class="bg-blue-600 text-white px-4 py-2 rounded">Next</button>
                </div>
                <button id="tutorial-skip" class="absolute top-2 right-2 text-gray-400 hover:text-gray-600">×</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Highlight target element
        const targetElement = document.querySelector(steps[currentStep].target);
        if (targetElement) {
            targetElement.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-75');
        }

        updateTutorialContent();

        // Event listeners
        document.getElementById('tutorial-next').addEventListener('click', nextStep);
        document.getElementById('tutorial-prev').addEventListener('click', prevStep);
        document.getElementById('tutorial-skip').addEventListener('click', endTutorial);
    }

    function updateTutorialContent() {
        document.getElementById('tutorial-title').textContent = steps[currentStep].title;
        document.getElementById('tutorial-content').textContent = steps[currentStep].content;

        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');

        prevBtn.disabled = currentStep === 0;
        nextBtn.textContent = currentStep === steps.length - 1 ? 'Finish' : 'Next';
    }

    function nextStep() {
        if (currentStep < steps.length - 1) {
            clearHighlight();
            currentStep++;
            updateTutorialContent();
            highlightTarget();
        } else {
            endTutorial();
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            clearHighlight();
            currentStep--;
            updateTutorialContent();
            highlightTarget();
        }
    }

    function highlightTarget() {
        const targetElement = document.querySelector(steps[currentStep].target);
        if (targetElement) {
            targetElement.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-75');
        }
    }

    function clearHighlight() {
        document.querySelectorAll('.ring-yellow-400').forEach(el => {
            el.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-75');
        });
    }

    function endTutorial() {
        clearHighlight();
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    createOverlay();
}
