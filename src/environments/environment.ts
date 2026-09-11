export const environment = {
    production: false,
    apiBase: 'http://localhost:8080',
    wsBase: 'ws://localhost:8080',
    clientId: 'knx-default-client',
    clientSecret: 'change-me-in-production',
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