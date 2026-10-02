declare const router: import("express-serve-static-core").Router;
export declare function assertCanAccessElderly(auth: {
    id: string;
    role: "CAREGIVER" | "ELDERLY";
} | undefined, elderlyId: string): boolean;
export default router;
//# sourceMappingURL=routes.d.ts.map