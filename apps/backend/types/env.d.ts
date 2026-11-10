declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'DEV' | 'PROD' | 'TEST';
            PORT: number;
            JWT_SECRET: string;
            WEB_ORIGINS?: string;
            DB_HOST: string; 
            DB_PORT: number;
            DB_USERNAME: string;
            DB_PASSWORD: string;
            DB_DATABASE: string;
            DB_AUTO_SYNC: 'true' | 'false' | '1' | '0';
        }
    }
}

export {};