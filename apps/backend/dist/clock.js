export class SystemClock {
    now() {
        return new Date();
    }
}
export class FakeClock {
    current;
    constructor(initial) {
        this.current = initial ? new Date(initial.getTime()) : new Date();
    }
    now() {
        return new Date(this.current.getTime());
    }
    set(date) {
        this.current = new Date(date.getTime());
    }
    advance(ms) {
        if (ms < 0) {
            throw new Error("ms must be non-negative");
        }
        this.current = new Date(this.current.getTime() + ms);
    }
    advanceSeconds(seconds) {
        this.advance(seconds * 1000);
    }
}
