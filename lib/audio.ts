/**
 * Service to manage synthesized siren alarms and desktop notifications.
 * Synthesizing audio via the Web Audio API bypasses static file loading issues (404 errors)
 * and guarantees sound generation once the user interacts with the page.
 */

export type AlertType = 'CRASH' | 'INTOXICATION' | 'TEST';

class SirenPlayerManager {
    private audioCtx: AudioContext | null = null;
    private osc: OscillatorNode | null = null;
    private lfo: OscillatorNode | null = null;
    private lfoGain: GainNode | null = null;
    private gainNode: GainNode | null = null;
    private isPlaying: boolean = false;
    private activeType: AlertType | null = null;

    /**
     * Start the synthesized siren.
     */
    public start(type: AlertType) {
        if (typeof window === 'undefined') return;

        // If already playing the same type, ignore. If different, stop first.
        if (this.isPlaying) {
            if (this.activeType === type) return;
            this.stop();
        }

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) {
                console.warn("Web Audio API is not supported in this browser.");
                return;
            }

            this.audioCtx = new AudioContextClass();
            this.osc = this.audioCtx.createOscillator();
            this.lfo = this.audioCtx.createOscillator();
            this.lfoGain = this.audioCtx.createGain();
            this.gainNode = this.audioCtx.createGain();

            // Configure audio profile based on urgency
            if (type === 'CRASH') {
                // High urgency wailing siren
                this.osc.type = 'sawtooth';
                this.osc.frequency.value = 650; // base frequency
                this.lfo.type = 'sine';
                this.lfo.frequency.value = 3.0; // 3 wails per second
                this.lfoGain.gain.value = 250; // oscillates +/- 250Hz
            } else if (type === 'INTOXICATION') {
                // Alternating alert warning
                this.osc.type = 'triangle';
                this.osc.frequency.value = 440; // lower base frequency
                this.lfo.type = 'sawtooth';
                this.lfo.frequency.value = 1.2; // slower alert pace
                this.lfoGain.gain.value = 120; // oscillates +/- 120Hz
            } else {
                // Standard test siren
                this.osc.type = 'sine';
                this.osc.frequency.value = 550;
                this.lfo.type = 'sine';
                this.lfo.frequency.value = 1.8;
                this.lfoGain.gain.value = 150;
            }

            // Connect modulator (LFO) -> LFO Gain -> Carrier Frequency (Pitch sweep)
            this.lfo.connect(this.lfoGain);
            this.lfoGain.connect(this.osc.frequency);

            // Connect Carrier -> Main Gain -> Audio Output
            this.osc.connect(this.gainNode);
            this.gainNode.connect(this.audioCtx.destination);

            // Smooth fade-in to prevent loud clicks
            const now = this.audioCtx.currentTime;
            this.gainNode.gain.setValueAtTime(0, now);
            this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.15);

            // Start synthesis
            this.osc.start(now);
            this.lfo.start(now);

            this.isPlaying = true;
            this.activeType = type;

            // Handle browser autoplay policy (suspended state)
            if (this.audioCtx.state === 'suspended') {
                console.log("AudioContext is suspended; awaiting user interaction/resume.");
            }
        } catch (e) {
            console.error("Failed to start Web Audio siren:", e);
        }
    }

    /**
     * Stop the synthesized siren and clean up audio nodes.
     */
    public stop() {
        if (!this.isPlaying) return;

        try {
            const stopNodes = () => {
                if (this.osc) {
                    try { this.osc.stop(); } catch (_) {}
                    this.osc.disconnect();
                    this.osc = null;
                }
                if (this.lfo) {
                    try { this.lfo.stop(); } catch (_) {}
                    this.lfo.disconnect();
                    this.lfo = null;
                }
                if (this.lfoGain) {
                    this.lfoGain.disconnect();
                    this.lfoGain = null;
                }
                if (this.gainNode) {
                    this.gainNode.disconnect();
                    this.gainNode = null;
                }
                if (this.audioCtx) {
                    if (this.audioCtx.state !== 'closed') {
                        this.audioCtx.close();
                    }
                    this.audioCtx = null;
                }
                this.isPlaying = false;
                this.activeType = null;
            };

            // Smooth fade-out before stopping to avoid click artifact
            if (this.gainNode && this.audioCtx) {
                const now = this.audioCtx.currentTime;
                this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
                this.gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
                setTimeout(stopNodes, 120);
            } else {
                stopNodes();
            }
        } catch (e) {
            console.error("Failed to stop Web Audio siren:", e);
            this.isPlaying = false;
            this.activeType = null;
        }
    }

    /**
     * Resumes the audio context if it is suspended (to registers user interaction).
     */
    public async resume(): Promise<boolean> {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
            return (this.audioCtx.state as string) === 'running';
        }
        return false;
    }

    public getActiveType(): AlertType | null {
        return this.activeType;
    }
}

export const SirenPlayer = new SirenPlayerManager();

/**
 * Request notification permission from the user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }
    
    if (Notification.permission === 'default') {
        return await Notification.requestPermission();
    }
    
    return Notification.permission;
}

/**
 * Display a desktop notification.
 */
export function sendDesktopNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;
    
    if (Notification.permission === 'granted') {
        return new Notification(title, {
            icon: '/favicon.ico',
            ...options,
        });
    }
    return null;
}
