// src/utils/audio.js
// Procedural audio generation using Web Audio API

class AudioSystem {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.init();
    }

    init() {
        // Initialize on first user interaction or explicitly
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, vol = 0.1, slideFreq = null) {
        if (!this.ctx || this.muted) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, vol = 0.1) {
        if (!this.ctx || this.muted) return;
        this.resume();

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Simple lowpass filter for noise
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    // --- Sound Effects Library ---

    sfxUIHover() {
        this.playTone(600, 'sine', 0.05, 0.02);
    }

    sfxUIClick() {
        this.playTone(800, 'sine', 0.1, 0.03, 1000);
    }

    sfxAttackMelee() {
        // Swish sound (noise + sine)
        this.playNoise(0.2, 0.1);
        this.playTone(150, 'triangle', 0.2, 0.05, 50);
    }

    sfxAttackMagic() {
        // Zap sound
        this.playTone(400, 'sawtooth', 0.3, 0.05, 1200);
    }

    sfxAttackHeavy() {
        // Deep thud + noise
        this.playNoise(0.4, 0.15);
        this.playTone(80, 'square', 0.4, 0.08, 30);
    }

    sfxDamage() {
        // Grunt / Hit
        this.playTone(120, 'sawtooth', 0.2, 0.08, 60);
        this.playNoise(0.1, 0.05);
    }

    sfxCritDamage() {
        // Sharp ringing hit
        this.playTone(800, 'square', 0.3, 0.08, 100);
        this.playNoise(0.3, 0.15);
    }

    sfxGold() {
        // Coin clink
        this.playTone(1200, 'sine', 0.1, 0.03, 1600);
        setTimeout(() => this.playTone(1600, 'sine', 0.2, 0.03, 2000), 100);
    }

    sfxEquip() {
        // Metallic clunk
        this.playTone(300, 'square', 0.1, 0.05, 100);
    }

    sfxLevelUp() {
        // Short fanfare
        this.playTone(400, 'sine', 0.2, 0.05);
        setTimeout(() => this.playTone(500, 'sine', 0.2, 0.05), 150);
        setTimeout(() => this.playTone(600, 'sine', 0.4, 0.05), 300);
    }
    
    sfxHeal() {
       // Gentle upward chime
       this.playTone(400, 'sine', 0.4, 0.05, 800);
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}

export const audioSystem = new AudioSystem();
