// Dans un nouveau fichier src/components/MetronomeLogo.ts

const createMetronomeLogo = (): HTMLDivElement => {
    const logoContainer = document.createElement('div');
    logoContainer.className = 'metronome-logo';
    
    logoContainer.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M35 85 L65 85 L70 20 L50 10 L30 20 Z" 
                  stroke="currentColor" 
                  stroke-width="4" 
                  fill="none"/>
            <line x1="50" y1="40" x2="65" y2="50" 
                  stroke="currentColor" 
                  stroke-width="4" 
                  stroke-linecap="round"/>
            <circle cx="50" cy="40" r="3" fill="currentColor"/>
        </svg>
    `;

    return logoContainer;
};

export default createMetronomeLogo;