export const environment = {
    production: false,
    apiBase: 'http://localhost:3000',
    wsBase: 'ws://localhost:3000',
    tokenEndpoint: '/oauth/access',
    logging: {
        enableConsole: true,
        logLevel: 'debug'
    },
    features: {
        enableDevTools: true,
        enablePerformanceMonitoring: true
    }
};
