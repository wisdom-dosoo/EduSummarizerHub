// referral.js - Referral program functionality
document.addEventListener('DOMContentLoaded', function() {
    // Generate unique referral code for user (in real app, this would come from backend)
    const referralCode = generateReferralCode();
    localStorage.setItem('userReferralCode', referralCode);

    // Add referral section to dashboard if on dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        addReferralSection();
    }
});

function generateReferralCode() {
    // Simple code generation (in production, use UUID or backend-generated)
    return 'EDU' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function addReferralSection() {
    const main = document.querySelector('main');
    if (!main) return;

    const referralSection = document.createElement('div');
    referralSection.className = 'bg-white p-4 md:p-6 rounded-lg shadow-md mt-6 md:mt-8';
    referralSection.innerHTML = `
        <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4">🎁 Referral Program</h3>
        <p class="text-gray-600 mb-4">Share EduSummarizer Hub with friends and earn free premium months!</p>
        <div class="flex flex-col sm:flex-row gap-3 mb-4">
            <input type="text" id="referralCode" value="${localStorage.getItem('userReferralCode')}" readonly
                   class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm md:text-base">
            <button id="copyReferralBtn" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-300 text-sm md:text-base whitespace-nowrap">
                Copy Code
            </button>
        </div>
        <div class="text-sm text-gray-500">
            <p>✅ Refer 3 friends → 1 free month</p>
            <p>✅ Refer 10 friends → 3 free months</p>
        </div>
    `;

    main.appendChild(referralSection);

    // Copy functionality
    document.getElementById('copyReferralBtn').addEventListener('click', function() {
        const codeInput = document.getElementById('referralCode');
        codeInput.select();
        document.execCommand('copy');

        // Visual feedback
        const btn = this;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
        btn.classList.add('bg-gray-600');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('bg-gray-600');
            btn.classList.add('bg-green-600', 'hover:bg-green-700');
        }, 2000);
    });
}

// Track referral usage (would integrate with backend in production)
function trackReferralUse(code) {
    // In production, send to backend API
    console.log('Referral code used:', code);
    // Update user's referral count, potentially grant rewards
}
