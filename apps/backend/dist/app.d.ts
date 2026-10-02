import { SystemClock, FakeClock } from "./clock.js";
declare const app: import("express-serve-static-core").Express;
export declare const clock: FakeClock | SystemClock;
export declare function bootstrap(): Promise<void>;
export default app;
//# sourceMappingURL=app.d.ts.map