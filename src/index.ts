import './styles/main.css';
import { AudioTimer } from './core/AudioTimer';
import { SoundEngine } from './core/SoundEngine';
import { TrainingEngine } from './training/TrainingEngine';
import { SongTrainingManager } from './training/SongTrainingManager';


enum MetronomeMode {
    Classic = 'classic',
    Training = 'training'
}

class Metronome {
    private audioTimer: AudioTimer;
    private soundEngine: SoundEngine;
    private trainingEngine: TrainingEngine;
    private songTrainingManager: SongTrainingManager;
    private currentMode: MetronomeMode = MetronomeMode.Classic;
    private isPlaying: boolean = false;
    private tempo: number = 120;
    private visualIndicator!: HTMLDivElement;
    private audioContext: AudioContext;
    private tempoSlider!: HTMLInputElement;
    private tempoNumber!: HTMLInputElement;
    private startStopButton!: HTMLButtonElement;
    private classicModeButton!: HTMLButtonElement;
    private trainingModeButton!: HTMLButtonElement;
    private nextSongButton!: HTMLButtonElement;
    private addSongButton!: HTMLButtonElement;
    private songListElement!: HTMLDivElement;
    private bpmFeedbackElement!: HTMLDivElement;

    constructor() {
        this.soundEngine = new SoundEngine();
        this.audioContext = this.soundEngine.getAudioContext();
        this.audioTimer = new AudioTimer(this.soundEngine);
        this.trainingEngine = new TrainingEngine(this.audioContext);
        this.songTrainingManager = new SongTrainingManager();

        this.visualIndicator = document.querySelector('.visual-indicator') as HTMLDivElement;
        
        this.audioTimer.setVisualCallback(() => {
            this.visualIndicator.classList.add('active');
            setTimeout(() => {
                this.visualIndicator.classList.remove('active');
            }, 100);
        });

        this.initializeUI();
        this.setupEventListeners();
        this.setupTrainingEventListeners();
    }
    


    private async initializeUI(): Promise<void> {
        const container = document.querySelector('.container') as HTMLDivElement;
        
        // Header avec logo et bouton d'installation
        const header = document.createElement('div');
        header.className = 'app-header';
        
        // Logo et titre
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
            <span>Pro Metronome</span>
        `;
    
        // Bouton d'installation
        const installButton = document.createElement('button');
installButton.className = 'install-button';
installButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
    Ajouter à l'écran d'accueil
`;
installButton.style.display = 'none';

// Gestion de l'installation PWA
let deferredPrompt: any = null;

// Vérifier si l'app est déjà installée
if (window.matchMedia('(display-mode: standalone)').matches) {
    installButton.style.display = 'none';
} else {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = 'flex';
        
        // Afficher une notification pour informer l'utilisateur
        this.bpmFeedbackElement.textContent = 'Vous pouvez installer l\'application sur votre appareil !';
        setTimeout(() => {
            this.bpmFeedbackElement.textContent = '';
        }, 3000);
    });
}

installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
            installButton.style.display = 'none';
            this.bpmFeedbackElement.textContent = 'Installation réussie !';
            setTimeout(() => {
                this.bpmFeedbackElement.textContent = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Erreur lors de l\'installation:', error);
        this.bpmFeedbackElement.textContent = 'Erreur lors de l\'installation. Réessayez plus tard.';
    }
    deferredPrompt = null;
});

// Gérer l'événement d'installation réussie
window.addEventListener('appinstalled', () => {
    installButton.style.display = 'none';
    this.bpmFeedbackElement.textContent = 'Application installée avec succès !';
    setTimeout(() => {
        this.bpmFeedbackElement.textContent = '';
    }, 2000);
});
        header.appendChild(logoContainer);
        header.appendChild(installButton);
    
        // Création du conteneur principal des contrôles
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls';
    
        // Mode switcher
        const modeSwitcherContainer = document.createElement('div');
        modeSwitcherContainer.className = 'mode-switcher';
    
        this.classicModeButton = document.createElement('button');
        this.classicModeButton.textContent = 'Classic Mode';
        this.classicModeButton.className = 'mode-button classic active';
    
        this.trainingModeButton = document.createElement('button');
        this.trainingModeButton.textContent = 'Training Mode';
        this.trainingModeButton.className = 'mode-button training';
    
        // Contrôles de tempo
        this.tempoSlider = document.createElement('input');
        this.tempoSlider.type = 'range';
        this.tempoSlider.id = 'tempo-slider';
        this.tempoSlider.min = '40';
        this.tempoSlider.max = '250';
        this.tempoSlider.value = '120';
    
        this.tempoNumber = document.createElement('input');
        this.tempoNumber.type = 'number';
        this.tempoNumber.id = 'tempo-number';
        this.tempoNumber.min = '40';
        this.tempoNumber.max = '250';
        this.tempoNumber.value = '120';
    
        const tempoContainer = document.createElement('div');
        tempoContainer.className = 'tempo-settings';
        tempoContainer.appendChild(this.tempoSlider);
        tempoContainer.appendChild(this.tempoNumber);
    
        // Boutons de contrôle
        this.startStopButton = document.createElement('button');
        this.startStopButton.className = 'start-stop-button stopped';
        this.startStopButton.textContent = 'Start';
    
        this.nextSongButton = document.createElement('button');
        this.nextSongButton.className = 'control-button next-song';
        this.nextSongButton.textContent = 'Next Song';
        this.nextSongButton.style.display = 'none';
    
        this.addSongButton = document.createElement('button');
        this.addSongButton.className = 'control-button add-song';
        this.addSongButton.textContent = 'Add Song';
        this.addSongButton.style.display = 'none';
    
        // Éléments de feedback
        this.bpmFeedbackElement = document.createElement('div');
        this.bpmFeedbackElement.className = 'feedback-container';
    
        this.songListElement = document.createElement('div');
        this.songListElement.className = 'song-list-container';
    
        // Construction de l'interface
        modeSwitcherContainer.appendChild(this.classicModeButton);
        modeSwitcherContainer.appendChild(this.trainingModeButton);
    
        container.innerHTML = '';
        container.appendChild(header);
        
        controlsContainer.appendChild(modeSwitcherContainer);
        controlsContainer.appendChild(tempoContainer);
        controlsContainer.appendChild(this.startStopButton);
        controlsContainer.appendChild(this.nextSongButton);
        controlsContainer.appendChild(this.addSongButton);
        controlsContainer.appendChild(this.bpmFeedbackElement);
        controlsContainer.appendChild(this.songListElement);
    
        container.appendChild(controlsContainer);
    
        this.updateButtonStates();
    }

    private setupEventListeners(): void {
        // Mode switching
        this.classicModeButton.addEventListener('click', () => this.switchMode(MetronomeMode.Classic));
        this.trainingModeButton.addEventListener('click', () => this.switchMode(MetronomeMode.Training));
        
        // Start/Stop
        this.startStopButton.addEventListener('click', () => this.togglePlayback());
        
        // Training mode controls
        this.nextSongButton.addEventListener('click', () => this.switchToNextSong());
        this.addSongButton.addEventListener('click', () => this.showAddSongPrompt());

        // Tempo controls
        this.tempoSlider.addEventListener('input', (e: Event) => {
            const newTempo = parseInt((e.target as HTMLInputElement).value);
            this.setTempo(newTempo);
            this.tempoNumber.value = newTempo.toString();
        });

        this.tempoNumber.addEventListener('change', (e: Event) => {
            const newTempo = parseInt((e.target as HTMLInputElement).value);
            this.setTempo(newTempo);
            this.tempoSlider.value = newTempo.toString();
        });
    }

    private setupTrainingEventListeners(): void {
        window.addEventListener('training-started', (event: Event) => {
            const customEvent = event as CustomEvent;
            const { targetBpm, duration } = customEvent.detail;
     
            this.setTempo(targetBpm);
            if (this.tempoSlider) this.tempoSlider.value = targetBpm.toString();
            if (this.tempoNumber) this.tempoNumber.value = targetBpm.toString();
     
            this.bpmFeedbackElement.innerHTML = `Training Started: ${targetBpm} BPM`;
        });
     
        window.addEventListener('training-countdown', (event: Event) => {
            const customEvent = event as CustomEvent;
            const { remainingTime, totalDuration } = customEvent.detail;
     
            const progressBar = document.createElement('div');
            progressBar.style.width = `${(remainingTime / totalDuration) * 100}%`;
            progressBar.style.height = '5px';
            progressBar.style.backgroundColor = 'green';
            progressBar.style.transition = 'width 1s linear';
            
            this.bpmFeedbackElement.innerHTML = `Time Left: ${remainingTime}s`;
            this.bpmFeedbackElement.appendChild(progressBar);
        });
        window.addEventListener('bpm-detection', (event: Event) => {
            const customEvent = event as CustomEvent;
            const { targetBpm, detectedBpm, isMatchingBpm, accuracy } = customEvent.detail;
        
            // Créer ou mettre à jour l'élément de feedback BPM
            const bpmFeedback = document.createElement('div');
            bpmFeedback.className = `bpm-feedback ${isMatchingBpm ? 'matching' : 'not-matching'}`;
            
            // Mise à jour du contenu
            bpmFeedback.innerHTML = `
                <div class="detected-bpm">
                    ${detectedBpm} BPM
                </div>
                <div class="target-info">
                    Target: ${targetBpm} BPM
                </div>
                <div class="accuracy-meter">
                    <div class="fill" style="width: ${accuracy}%"></div>
                </div>
                <div class="status">
                    ${isMatchingBpm ? '✅ On tempo!' : '⚠️ Adjust your tempo'}
                </div>
            `;
        
            // Remplacer l'ancien feedback s'il existe
            const oldFeedback = this.bpmFeedbackElement.querySelector('.bpm-feedback');
            if (oldFeedback) {
                this.bpmFeedbackElement.replaceChild(bpmFeedback, oldFeedback);
            } else {
                this.bpmFeedbackElement.appendChild(bpmFeedback);
            }
        });
     
        window.addEventListener('training-stopped', () => {
            this.bpmFeedbackElement.textContent = 'Training Complete!';
        });
     
        window.addEventListener('training-error', (event: Event) => {
            const customEvent = event as CustomEvent;
            const { message } = customEvent.detail;
     
            this.bpmFeedbackElement.textContent = `Error: ${message}`;
            this.bpmFeedbackElement.style.color = 'red';
        });
    }

    private async updateButtonStates(): Promise<void> {
        const songs = this.songTrainingManager.getSongList();
        const hasOneSong = songs.length > 0;
        const hasMultipleSongs = songs.length > 1;
    
        if (this.currentMode === MetronomeMode.Training) {
            this.addSongButton.style.display = 'inline-block';
            this.nextSongButton.style.display = hasMultipleSongs ? 'inline-block' : 'none';
            
            this.tempoSlider.disabled = true;
            this.tempoNumber.disabled = true;
            
            this.startStopButton.disabled = !hasOneSong;
            
            await this.updateSongList(songs);
        } else {
            this.addSongButton.style.display = 'none';
            this.nextSongButton.style.display = 'none';
            
            this.tempoSlider.disabled = false;
            this.tempoNumber.disabled = false;
            this.startStopButton.disabled = false;
            
            this.songListElement.innerHTML = '';
        }
    }

    private async updateSongList(songs: Array<{ name: string; bpm: number }>): Promise<void> {
        this.songListElement.innerHTML = '';
        
        if (this.currentMode === MetronomeMode.Training) {
            const title = document.createElement('h3');
            title.textContent = 'Song List';
            this.songListElement.appendChild(title);
    
            // Ajout du bloc de statut du micro en haut
            await this.addMicrophoneStatus(this.songListElement);
    
            if (songs.length === 0) {
                const noSongs = document.createElement('p');
                noSongs.className = 'no-songs';
                noSongs.textContent = 'No songs added yet. Add a song to start training!';
                this.songListElement.appendChild(noSongs);
            } else {
                // Affichage du morceau actuel
                const currentSong = this.songTrainingManager.getCurrentSong();
                const nextSong = this.getNextSong();
    
                const currentSongDiv = document.createElement('div');
                currentSongDiv.className = 'current-song';
                currentSongDiv.innerHTML = `
                    <h4>Current Song</h4>
                    <div class="song-item current">
                        ${currentSong ? `▶ ${currentSong.name} (${currentSong.bpm} BPM)` : 'No song selected'}
                    </div>
                `;
                this.songListElement.appendChild(currentSongDiv);
    
                // Affichage du prochain morceau si disponible
                if (songs.length > 1) {
                    const nextSongDiv = document.createElement('div');
                    nextSongDiv.className = 'next-song';
                    nextSongDiv.innerHTML = `
                        <h4>Next Song</h4>
                        <div class="song-item next">
                            ${nextSong ? `→ ${nextSong.name} (${nextSong.bpm} BPM)` : 'No next song'}
                        </div>
                    `;
                    this.songListElement.appendChild(nextSongDiv);
                }
    
                // Liste complète des morceaux
                const allSongsDiv = document.createElement('div');
                allSongsDiv.className = 'all-songs';
                allSongsDiv.innerHTML = '<h4>All Songs</h4>';
                
                songs.forEach((song, index) => {
                    const songElement = document.createElement('div');
                    songElement.className = 'song-item';
                    
                    let prefix = '  ';
                    if (currentSong && song.name === currentSong.name) {
                        prefix = '▶ ';
                        songElement.classList.add('current');
                    } else if (nextSong && song.name === nextSong.name) {
                        prefix = '→ ';
                        songElement.classList.add('next');
                    }
                    
                    songElement.textContent = `${prefix}${index + 1}. ${song.name} (${song.bpm} BPM)`;
                    allSongsDiv.appendChild(songElement);
                });
                
                this.songListElement.appendChild(allSongsDiv);
            }
        }
    }

    private getNextSong(): { name: string; bpm: number } | null {
        const songs = this.songTrainingManager.getSongList();
        const currentIndex = songs.findIndex(song => 
            song.name === this.songTrainingManager.getCurrentSong()?.name
        );
        
        if (currentIndex === -1 || songs.length <= 1) return null;
        const nextIndex = (currentIndex + 1) % songs.length;
        return songs[nextIndex];
    }
    
    private switchToNextSong(): void {
        const nextSong = this.songTrainingManager.nextSong();
        if (nextSong && this.isPlaying) {
            this.startTrainingMode(nextSong.bpm);
            this.bpmFeedbackElement.textContent = `Switched to: ${nextSong.name} (${nextSong.bpm} BPM)`;
            this.updateSongList(this.songTrainingManager.getSongList()); // Mise à jour de l'affichage
        }
    }
    private async addMicrophoneStatus(container: HTMLElement): Promise<void> {
        const micStatusDiv = document.createElement('div');
        micStatusDiv.className = 'mic-status';
        
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMicrophone = devices.some(device => device.kind === 'audioinput');
            
            micStatusDiv.innerHTML = `
                <h4>BPM Tracking Status</h4>
                <div class="status-indicator ${hasMicrophone ? 'available' : 'unavailable'}">
                    <span class="icon">${hasMicrophone ? '🎤' : '❌'}</span>
                    <span class="text">
                        ${hasMicrophone ? 
                          'Microphone detected - BPM tracking available' : 
                          'No microphone detected - BPM tracking unavailable'}
                    </span>
                </div>
            `;
        } catch (error) {
            micStatusDiv.innerHTML = `
                <h4>BPM Tracking Status</h4>
                <div class="status-indicator unavailable">
                    <span class="icon">❌</span>
                    <span class="text">Unable to detect microphone</span>
                </div>
            `;
        }
        
        container.insertBefore(micStatusDiv, container.firstChild);
    }

    private updateStartStopButton(): void {
        this.startStopButton.textContent = this.isPlaying ? 'Stop' : 'Start';
        this.startStopButton.classList.toggle('running', this.isPlaying);
        this.startStopButton.classList.toggle('stopped', !this.isPlaying);
    }
    

    
    private togglePlayback(): void {
        if (this.isPlaying) {
            this.stop();
        } else {
            if (this.currentMode === MetronomeMode.Training) {
                const currentSong = this.songTrainingManager.getCurrentSong();
                if (!currentSong) {
                    const addSong = window.confirm('No songs available. Would you like to add a song?');
                    if (addSong) {
                        this.showAddSongPrompt();
                    }
                    return;
                }
                this.startTrainingMode(currentSong.bpm);
            } else {
                this.start();
            }
        }
        this.updateStartStopButton();
    }

    

    private showAddSongPrompt(): void {
        const name = window.prompt('Enter song name:');
        const bpmStr = window.prompt('Enter BPM for this song (40-250):');
        
        if (name && bpmStr) {
            const bpm = parseInt(bpmStr);
            if (bpm >= 40 && bpm <= 250) {
                this.songTrainingManager.addSong(name, bpm);
                this.updateButtonStates();
            } else {
                alert('BPM must be between 40 and 250');
            }
        }
    }

 

    private setTempo(newTempo: number): void {
        this.tempo = Math.max(40, Math.min(250, newTempo));
        this.audioTimer.setTempo(this.tempo);
    }

    private start(): void {
        if (this.trainingEngine['isRunning']) {
            this.trainingEngine.stop();
        }
        this.isPlaying = true;
        this.audioTimer.start();
        this.updateStartStopButton();
    }
    
    private stop(): void {
        this.isPlaying = false;
        this.audioTimer.stop();
        if (this.currentMode === MetronomeMode.Training) {
            this.trainingEngine.stop();
        }
        this.updateStartStopButton();
    }
    
    private startTrainingMode(bpm: number): void {
        if (this.isPlaying) {
            this.stop();
        }
        this.isPlaying = true;
        this.trainingEngine.start(bpm);
        this.updateStartStopButton();
    }
    
    private switchMode(mode: MetronomeMode): void {
        this.currentMode = mode;
        
        if (mode === MetronomeMode.Classic) {
            this.classicModeButton.classList.add('active');
            this.trainingModeButton.classList.remove('active');
        } else {
            this.classicModeButton.classList.remove('active');
            this.trainingModeButton.classList.add('active');
        }
    
        this.stop(); // Cela appellera aussi updateStartStopButton
        this.updateButtonStates();
        
        if (mode === MetronomeMode.Training) {
            const currentSong = this.songTrainingManager.getCurrentSong();
            if (currentSong) {
                this.setTempo(currentSong.bpm);
                if (this.tempoSlider) this.tempoSlider.value = currentSong.bpm.toString();
                if (this.tempoNumber) this.tempoNumber.value = currentSong.bpm.toString();
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Metronome();
});