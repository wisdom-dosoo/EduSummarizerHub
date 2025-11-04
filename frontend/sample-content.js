// sample-content.js - Demo content for users to try without uploading
const sampleContent = {
    history: {
        title: "The Industrial Revolution",
        text: `The Industrial Revolution was a period of major industrialization that took place from the late 1700s to early 1800s. It began in Britain and spread to other parts of the world. This era marked a shift from agrarian economies to industrialized ones, characterized by factory systems, mass production, and technological innovations.

Key developments included the steam engine, mechanized textile production, and the rise of coal and iron industries. The revolution brought about significant social changes, including urbanization, the growth of the working class, and new economic systems. While it led to unprecedented economic growth and technological progress, it also created challenges such as poor working conditions, child labor, and environmental pollution.

Inventors like James Watt, Richard Arkwright, and George Stephenson played crucial roles in advancing technology. The revolution fundamentally transformed society, laying the foundation for the modern world and influencing global development patterns that continue to affect us today.`
    },

    science: {
        title: "Photosynthesis Process",
        text: `Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments. This complex biochemical process converts light energy into chemical energy, producing glucose and oxygen as byproducts.

The process occurs in two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). In the first stage, chlorophyll absorbs light energy, which is used to split water molecules, releasing oxygen and creating energy-rich molecules like ATP and NADPH.

The second stage uses these energy carriers to convert carbon dioxide from the atmosphere into glucose through a series of enzyme-catalyzed reactions. This process is crucial for life on Earth as it provides the foundation of the food chain and maintains atmospheric oxygen levels.

Factors affecting photosynthesis include light intensity, carbon dioxide concentration, temperature, and water availability. Understanding this process is essential for agriculture, environmental science, and addressing global climate change challenges.`
    },

    literature: {
        title: "Shakespeare's Hamlet",
        text: `Hamlet, written by William Shakespeare around 1600, is considered one of the greatest tragedies in English literature. The play tells the story of Prince Hamlet of Denmark, who seeks revenge for his father's murder by his uncle Claudius, who has also married Hamlet's mother Gertrude.

The famous "To be or not to be" soliloquy captures Hamlet's internal conflict and philosophical contemplation about life and death. The play explores themes of madness, corruption, mortality, and the complexity of human nature. Hamlet's indecision and contemplative nature contrast with the decisive actions of other characters.

The drama features memorable characters including the ghost of Hamlet's father, the loyal Horatio, the scheming Polonius, and his children Ophelia and Laertes. Shakespeare's use of language, including wordplay, metaphors, and dramatic irony, showcases his mastery of the English language.

Hamlet continues to be performed and studied worldwide, influencing countless adaptations in literature, film, and other media. Its exploration of universal human experiences ensures its enduring relevance and popularity.`
    },

    technology: {
        title: "Artificial Intelligence Overview",
        text: `Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. This field encompasses various technologies including machine learning, natural language processing, computer vision, and robotics.

Machine learning, a subset of AI, enables systems to automatically learn and improve from experience without being explicitly programmed. Deep learning, using neural networks with multiple layers, has revolutionized areas like image recognition and language translation.

AI applications span numerous industries: healthcare (diagnosis assistance), finance (fraud detection), transportation (autonomous vehicles), and entertainment (recommendation systems). While AI offers tremendous benefits including increased efficiency and new capabilities, it also raises ethical concerns about privacy, job displacement, and decision-making transparency.

The development of AI continues to accelerate, with recent advances in large language models and generative AI. Understanding both the potential and limitations of AI is crucial for its responsible development and integration into society.`
    }
};

function loadSampleContent(category) {
    const content = sampleContent[category];
    if (content) {
        // Fill the text area with sample content
        const textArea = document.getElementById('text');
        if (textArea) {
            textArea.value = content.text;
            textArea.focus();
        }

        // Show a success message
        showMessage(`Loaded sample content: "${content.title}"`, 'success');

        // Scroll to the text area
        textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.sample-message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `sample-message fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
    }`;
    messageDiv.innerHTML = `
        <div class="flex items-center">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                ×
            </button>
        </div>
    `;

    document.body.appendChild(messageDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 3000);
}

// Make functions globally available
window.loadSampleContent = loadSampleContent;
window.showMessage = showMessage;
