import { performance } from 'perf_hooks';

// Konversi Data
export function hexToUint8Array(hexString) {
    return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

// Event Loop Breather
export async function yieldEventLoop() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

export class Tracker {
    constructor() {
        this.timerInterval = null;
        this.startTime = null;
        this.currentIteration = 0;
        this.total = 0;
        this.label = "";
    }

    getFormattedTime() {
        if (!this.startTime) return "0.00s";
        const elapsedMs = performance.now() - this.startTime;
        return (elapsedMs / 1000).toFixed(2) + "s";
    }

    drawProgressBar() {
        const width = 30;
        const progress = this.currentIteration / this.total;
        const filled = Math.round(width * progress);
        const empty = width - filled;
        
        const bar = '█'.repeat(filled) + '-'.repeat(empty); 
        const percent = (progress * 100).toFixed(1).padStart(5, ' ');
        const timeStr = this.getFormattedTime().padStart(7, ' ');
        
        process.stdout.write(`\r${this.label} [${bar}] ${percent}% - Elapsed: ${timeStr}`);
        
        if (this.currentIteration === this.total) {
            process.stdout.write('\n'); 
        }
    }

    start(totalIterations, label) {
        this.total = totalIterations;
        this.label = label;
        this.currentIteration = 0;
        this.startTime = performance.now();
        
        this.timerInterval = setInterval(() => {
            if (this.currentIteration < this.total) {
                this.drawProgressBar();
            }
        }, 100);
    }

    update(current) {
        this.currentIteration = current;
        this.drawProgressBar();
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}