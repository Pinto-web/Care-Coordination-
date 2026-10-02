import "dotenv/config";
export declare const config: {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    CORS_ORIGIN: string;
    LOG_LEVEL: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    ENABLE_DEV_CLOCK: boolean;
};
export type Config = typeof config;
//# sourceMappingURL=config.d.ts.map