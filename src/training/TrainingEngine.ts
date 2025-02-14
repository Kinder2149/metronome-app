import { BpmDetector } from '../core/BpmDetector';  

export class TrainingEngine {
    private audioContext: AudioContext;
    private microphone: MediaStreamAudioSourceNode | null = null;
    private analyser: AnalyserNode | null = null;
    private bpmDetector: BpmDetector | null = null;
    private clickBuffer: AudioBuffer;
    private isRunning: boolean = false;
    private startTime: number = 0;
    private duration: number = 30; // 30 secondes
    private targetBpm: number;
    private countdownInterval: number | null = null;

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
        this.targetBpm = 120;
        this.clickBuffer = this.createClickBuffer();
    }

    private createClickBuffer(): AudioBuffer {
        const buffer = this.audioContext.createBuffer(1, 4096, this.audioContext.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const decay = Math.exp(-t * 50);
            channelData[i] = Math.sin(2 * Math.PI * 1000 * t) * decay;
        }
        
        return buffer;
    }

    public async start(bpm: number): Promise<void> {
        if (bpm < 40 || bpm > 250) {
            window.dispatchEvent(new CustomEvent('training-error', {
                detail: { message: 'BPM must be between 40 and 250' }
            }));
            return;
        }

        if (this.isRunning) return;

        this.targetBpm = bpm;
        this.startTime = this.audioContext.currentTime;
        this.isRunning = true;

        try {
            this.bpmDetector = new BpmDetector(
                this.audioContext,
                this.targetBpm,
                this.handleBpmMatch.bind(this)
            );

            await this.initializeMicrophone().catch(error => {
                console.warn('Microphone initialization failed, continuing without microphone', error);
            });

            this.schedulePlayback();
            this.startCountdown();

            window.dispatchEvent(new CustomEvent('training-started', {
                detail: { 
                    targetBpm: this.targetBpm, 
                    duration: this.duration 
                }
            }));
        } catch (error) {
            console.error('Training mode initialization error:', error);
            this.stop();
            
            window.dispatchEvent(new CustomEvent('training-error', {
                detail: { message: 'Failed to start training mode' }
            }));
        }
    }

    private async initializeMicrophone(): Promise<void> {
        if (!this.bpmDetector) return;

        try {
            this.microphone = await this.bpmDetector.initializeMicrophone();
            this.analyser = this.bpmDetector.createAnalyserNode();
            this.microphone.connect(this.analyser);
            this.startAmplitudeAnalysis();
        } catch (error) {
            console.error('Microphone access error:', error);
            throw error;
        }
    }
    private handleBpmMatch(isMatching: boolean, detectedBpm: number): void {
        window.dispatchEvent(new CustomEvent('bpm-detection', {
            detail: {
                targetBpm: this.targetBpm,
                detectedBpm: Math.round(detectedBpm),
                isMatchingBpm: isMatching,
                accuracy: Math.abs(100 - (Math.abs(this.targetBpm - detectedBpm) / this.targetBpm * 100))
            }
        }));
    }

    private startAmplitudeAnalysis(): void {
        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const timeData = new Float32Array(bufferLength);

        const analyze = () => {
            if (!this.isRunning || !this.analyser || !this.bpmDetector) return;

            this.analyser.getFloatTimeDomainData(timeData);
            const amplitude = Math.max(...Array.from(timeData).map(Math.abs));
            this.bpmDetector.processPeak(amplitude);

            requestAnimationFrame(analyze);
        };

        analyze();
    }

  
    private startCountdown(): void {
        let remainingTime = this.duration;

        this.countdownInterval = window.setInterval(() => {
            window.dispatchEvent(new CustomEvent('training-countdown', {
                detail: { 
                    remainingTime: remainingTime,
                    totalDuration: this.duration 
                }
            }));

            remainingTime--;

            if (remainingTime < 0) {
                this.stop();
            }
        }, 1000);
    }

    private schedulePlayback(): void {
        const interval = 60 / this.targetBpm;
        let currentTime = this.startTime;

        const playClick = () => {
            if (!this.isRunning) return;

            const elapsedTime = this.audioContext.currentTime - this.startTime;
            const volume = Math.max(0, 1 - elapsedTime / this.duration);

            if (elapsedTime < this.duration) {
                const source = this.audioContext.createBufferSource();
                const gainNode = this.audioContext.createGain();

                source.buffer = this.clickBuffer;
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                gainNode.gain.value = volume;

                source.start();
                setTimeout(playClick, interval * 1000);
            } else {
                this.stop();
            }
        };

        playClick();
    }

    public stop(): void {
        this.isRunning = false;
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        if (this.bpmDetector) {
            this.bpmDetector.reset();
            this.bpmDetector = null;
        }

        window.dispatchEvent(new CustomEvent('training-stopped'));
    }
}