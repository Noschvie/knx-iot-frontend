export const environment = {
    production: true,
    apiBase: 'http://bff:3000',
    wsBase: 'ws://bff:3000',
    tokenEndpoint: '/oauth/access',
    logging: {
        enableConsole: false,
        logLevel: 'error'
    },
    features: {
        enableDevTools: false,
        enablePerformanceMonitoring: false
    }
};
