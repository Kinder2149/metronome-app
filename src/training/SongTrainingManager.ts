interface Song {
    name: string;
    bpm: number;
}

export class SongTrainingManager {
    private songs: Song[] = [];
    private currentSongIndex: number = 0;

    constructor() {}

    public addSong(name: string, bpm: number): void {
        this.songs.push({ name, bpm });
    }

    public getCurrentSong(): Song | null {
        return this.songs.length > 0 ? this.songs[this.currentSongIndex] : null;
    }

    public nextSong(): Song | null {
        if (this.songs.length === 0) return null;

        this.currentSongIndex = (this.currentSongIndex + 1) % this.songs.length;
        return this.songs[this.currentSongIndex];
    }

    public getSongList(): Song[] {
        return [...this.songs];
    }

    public reset(): void {
        this.currentSongIndex = 0;
    }
}