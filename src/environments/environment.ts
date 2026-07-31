export const environment = {
    production: false,
    apiBase: 'http://localhost:3000',
    wsBase: 'ws://localhost:3000',
    clientId: 'knx-frontend-dev',
    clientSecret: '', // For dev only
    tokenEndpoint: '/oauth/access',
    discoveryUrl: '/.well-known/knx',
    logging: {
        enableConsole: true,
        enableStorage: true,
        logLevel: 'debug'
    },
    features: {
        enableMockData: true,
        enableDevTools: true,
        enablePerformanceMonitoring: true
    }
};