export interface Clock {
    now(): Date;
}
export declare class SystemClock implements Clock {
    now(): Date;
}
export declare class FakeClock implements Clock {
    private current;
    constructor(initial?: Date);
    now(): Date;
    set(date: Date): void;
    advance(ms: number): void;
    advanceSeconds(seconds: number): void;
}
//# sourceMappingURL=clock.d.ts.map