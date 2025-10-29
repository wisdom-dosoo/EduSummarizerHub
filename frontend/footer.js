// footer.js - Reusable footer component for EduSummarizer Hub
function createFooter() {
    const currentYear = new Date().getFullYear();
    return `
        <footer class="bg-gray-800 text-white py-6 mt-12">
            <div class="container mx-auto px-4 text-center">
                <p>&copy; ${currentYear} EduSummarizer Hub. All rights reserved.</p>
            </div>
        </footer>
    `;
}

// Auto-insert footer when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Footer script loaded, inserting footer...');
    const footerHTML = createFooter();
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    console.log('Footer inserted:', footerHTML);
});
