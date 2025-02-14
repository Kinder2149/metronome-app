export class BpmDetector {
    private readonly DETECTION_WINDOW = 2000; // 2 secondes
    private readonly PEAK_THRESHOLD = 0.5;
    private readonly MIN_PEAKS = 3;
    private readonly TOLERANCE = 5; // BPM de tolérance
    
    private peaks: number[] = [];
    private consecutiveMatches = 0;
    private lastProcessedTime = 0;
    private movingAverage: number[] = [];
    
    constructor(
        private readonly audioContext: AudioContext,
        private readonly targetBpm: number,
        private readonly onBpmMatch: (isMatching: boolean, detectedBpm: number) => void
    ) {}

    public async initialize(): Promise<MediaStreamAudioSourceNode> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                }
            });

            return this.audioContext.createMediaStreamSource(stream);
        } catch (error) {
            console.error('Erreur d\'accès au microphone:', error);
            throw error;
        }
    }

    public processPeak(amplitude: number): void {
        const now = performance.now();
        
        // Éviter le traitement trop fréquent
        if (now - this.lastProcessedTime < 50) return; // 50ms minimum entre les pics
        
        if (amplitude > this.PEAK_THRESHOLD) {
            this.peaks.push(now);
            this.lastProcessedTime = now;
            
            // Nettoyer les vieux pics
            const windowStart = now - this.DETECTION_WINDOW;
            this.peaks = this.peaks.filter(p => p > windowStart);
            
            // Calculer le BPM si on a assez de pics
            if (this.peaks.length >= this.MIN_PEAKS) {
                const detectedBpm = this.calculateBpm();
                if (detectedBpm > 0) {
                    this.validateBpm(detectedBpm);
                }
            }
        }
    }

    private calculateBpm(): number {
        const intervals: number[] = [];
        for (let i = 1; i < this.peaks.length; i++) {
            intervals.push(this.peaks[i] - this.peaks[i - 1]);
        }
        
        // Utiliser la médiane pour plus de stabilité
        const medianInterval = this.calculateMedian(intervals);
        const instantBpm = 60000 / medianInterval; // Conversion en BPM
        
        // Appliquer une moyenne mobile
        this.movingAverage.push(instantBpm);
        if (this.movingAverage.length > 5) {
            this.movingAverage.shift();
        }
        
        return this.calculateMedian(this.movingAverage);
    }
    public createAnalyserNode(): AnalyserNode {
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 2048;
        return analyser;
    }
    
    public async initializeMicrophone(): Promise<MediaStreamAudioSourceNode> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                }
            });
    
            return this.audioContext.createMediaStreamSource(stream);
        } catch (error) {
            console.error('Erreur d\'accès au microphone:', error);
            throw error;
        }
    }

    private validateBpm(detectedBpm: number): void {
        const isMatching = Math.abs(detectedBpm - this.targetBpm) <= this.TOLERANCE;
        
        if (isMatching) {
            this.consecutiveMatches++;
            if (this.consecutiveMatches >= 3) {
                this.onBpmMatch(true, detectedBpm);
            }
        } else {
            this.consecutiveMatches = 0;
            this.onBpmMatch(false, detectedBpm);
        }
    }

    private calculateMedian(numbers: number[]): number {
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        return sorted[middle];
    }

    public reset(): void {
        this.peaks = [];
        this.consecutiveMatches = 0;
        this.movingAverage = [];
        this.lastProcessedTime = 0;
    }
}