// Dans un nouveau fichier src/components/InstallButton.ts

const createInstallButton = (): HTMLButtonElement => {
    const installButton = document.createElement('button');
    installButton.className = 'install-button';
    installButton.style.display = 'none';
    installButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        Installer l'application
    `;

    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = 'flex';
    });

    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installButton.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });

    return installButton;
};

export default createInstallButton;