import { SoundEngine } from './SoundEngine';

export class AudioTimer {
    private audioContext: AudioContext;
    private nextNoteTime: number;
    private timerWorker: Worker;
    private tempo: number;
    private isPlaying: boolean;
    private soundEngine: SoundEngine;
    private visualCallback: (() => void) | null = null;
    private beatCount: number = 0;

    constructor(soundEngine: SoundEngine) {
        this.audioContext = soundEngine.getAudioContext();
        this.nextNoteTime = 0.0;
        this.tempo = 120;
        this.isPlaying = false;
        this.soundEngine = soundEngine;

        const blob = new Blob([`
            let timerID = null;
            self.onmessage = function(e) {
                if (e.data === "start") {
                    timerID = setInterval(function() {
                        postMessage("tick");
                    }, 25);
                } else if (e.data === "stop") {
                    clearInterval(timerID);
                    timerID = null;
                }
            };
        `], { type: 'text/javascript' });

        this.timerWorker = new Worker(URL.createObjectURL(blob));
        this.timerWorker.onmessage = this.scheduler.bind(this);
    }

    public setVisualCallback(callback: () => void): void {
        this.visualCallback = callback;
    }

    public start(): void {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.nextNoteTime = this.audioContext.currentTime;
        this.beatCount = 0;
        this.timerWorker.postMessage("start");
    }

    public stop(): void {
        this.isPlaying = false;
        this.timerWorker.postMessage("stop");
    }

    public setTempo(newTempo: number): void {
        this.tempo = Math.max(30, Math.min(250, newTempo));
    }

    private scheduler(): void {
        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNoteTime += 60.0 / this.tempo;
            this.beatCount++;
        }
    }

    private scheduleNote(time: number): void {
        this.soundEngine.playClick(time);
        
        if (this.visualCallback) {
            setTimeout(() => {
                this.visualCallback?.();
            }, (time - this.audioContext.currentTime) * 1000);
        }
    }
}