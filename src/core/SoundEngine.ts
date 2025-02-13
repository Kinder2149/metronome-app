export class SoundEngine {
    private audioContext!: AudioContext;
    private clickBuffer!: AudioBuffer | null;

    constructor() {
        console.warn('🔊 SoundEngine: Début de l\'initialisation');
        
        if (typeof window === 'undefined') {
            console.error('❌ Environnement window non disponible');
            return;
        }

        if (!window.AudioContext && !window.webkitAudioContext) {
            console.error('❌ Web Audio API non supportée');
            alert('Votre navigateur ne supporte pas Web Audio API');
            return;
        }

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ Contexte audio créé');

            this.clickBuffer = null;
            this.loadSounds().catch(error => {
                console.error('❌ Erreur de chargement des sons:', error);
                this.clickBuffer = this.generateDefaultClickBuffer();
            });
        } catch (error) {
            console.error('❌ Erreur critique:', error);
        }
    }

    public getAudioContext(): AudioContext {
        if (!this.audioContext) {
            throw new Error('Contexte audio non initialisé');
        }
        return this.audioContext;
    }

    private async loadSounds(): Promise<void> {
        console.log('🔊 Tentative de chargement du son');
        try {
            const response = await fetch('/sounds/click.wav');
            console.log('📥 Réponse fetch:', response);

            if (!response.ok) {
                throw new Error(`❌ Erreur HTTP: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            console.log('📊 Taille du buffer:', arrayBuffer.byteLength);

            this.clickBuffer = await this.audioContext.decodeAudioData(
                arrayBuffer, 
                (buffer) => {
                    console.log('✅ Son décodé avec succès', buffer);
                },
                (error) => {
                    console.error('❌ Erreur de décodage détaillée:', error);
                }
            );
        } catch (error) {
            console.error('❌ Échec du chargement:', error);
            this.clickBuffer = this.generateDefaultClickBuffer();
        }
    }

    private generateDefaultClickBuffer(): AudioBuffer {
        console.warn('⚠️ Génération d\'un son de clic par défaut');
        const buffer = this.audioContext.createBuffer(1, 2048, this.audioContext.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const clickFrequency = 1000; 
            const decay = Math.exp(-t * 100); 
            
            const squareWave = Math.sign(Math.sin(2 * Math.PI * clickFrequency * t));
            channelData[i] = squareWave * decay;
        }
        
        return buffer;
    }

    public playClick(time: number, volume: number = 1): void {
        console.log(`🎵 Tentative de lecture du son à ${time}`);
        
        if (!this.clickBuffer) {
            console.warn('⚠️ Aucun buffer audio disponible');
            return;
        }

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = this.clickBuffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            gainNode.gain.value = volume;
            source.start(time);
            console.log('✅ Son joué');
        } catch (error) {
            console.error('❌ Erreur de lecture:', error);
        }
    }
}