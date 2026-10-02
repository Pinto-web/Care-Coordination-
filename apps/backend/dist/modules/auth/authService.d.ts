export declare function ensureSeeded(): Promise<{
    caregiver: {
        id: string;
        role: "CAREGIVER" | "ELDERLY";
        fullName: string;
        email: string | null;
        passwordHash: string | null;
        createdBy: string | null;
        createdAt: Date;
    };
    elderly: {
        id: string;
        role: "CAREGIVER" | "ELDERLY";
        fullName: string;
        email: string | null;
        passwordHash: string | null;
        createdBy: string | null;
        createdAt: Date;
    };
}>;
export declare function verifyCaregiverCredentials(email: string, password: string): Promise<{
    id: string;
    role: "CAREGIVER" | "ELDERLY";
    fullName: string;
    email: string | null;
    passwordHash: string | null;
    createdBy: string | null;
    createdAt: Date;
} | null>;
//# sourceMappingURL=authService.d.ts.map