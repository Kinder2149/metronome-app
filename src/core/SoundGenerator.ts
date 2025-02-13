export class SoundGenerator {
    private audioContext: AudioContext;

    constructor() {
        this.audioContext = new AudioContext();
    }

    public generateClickWavFile(): Uint8Array {
        const buffer = this.createClickBuffer();
        return this.bufferToWav(buffer);
    }

    private createClickBuffer(): AudioBuffer {
        const buffer = this.audioContext.createBuffer(1, 2048, this.audioContext.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const clickFrequency = 1000; // Fréquence élevée
            const decay = Math.exp(-t * 100); // Décroissance rapide
            
            // Onde carrée avec enveloppe exponentielle
            const squareWave = Math.sign(Math.sin(2 * Math.PI * clickFrequency * t));
            channelData[i] = squareWave * decay;
        }
        
        return buffer;
    }

    private bufferToWav(audioBuffer: AudioBuffer): Uint8Array {
        const numOfChan = audioBuffer.numberOfChannels;
        const samples = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;

        // Création de l'en-tête WAV
        const wavBuffer = new ArrayBuffer(44 + samples * 2);
        const view = new DataView(wavBuffer);

        // En-tête RIFF
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples * 2, true);
        writeString(view, 8, 'WAVE');

        // En-tête fmt 
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // Format PCM
        view.setUint16(22, numOfChan, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2 * numOfChan, true);
        view.setUint16(32, 2 * numOfChan, true);
        view.setUint16(34, 16, true);

        // En-tête data
        writeString(view, 36, 'data');
        view.setUint32(40, samples * 2, true);

        // Écriture des échantillons
        const channel = audioBuffer.getChannelData(0);
        const output = new Int16Array(samples);

        for (let i = 0; i < samples; i++) {
            // Conversion des échantillons float en Int16
            const s = Math.max(-1, Math.min(1, channel[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Copie des données
        const dataView = new Uint8Array(wavBuffer, 44);
        const int16View = new Uint8Array(output.buffer);
        dataView.set(int16View);

        return new Uint8Array(wavBuffer);
    }

    private saveWavFile(wav: Uint8Array, filename: string): void {
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Nettoyage
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Fonction utilitaire pour écrire des chaînes dans le buffer
function writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}