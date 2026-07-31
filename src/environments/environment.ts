export const environment = {
    production: false,
    apiBase: 'https://api.knx-iot.example.com',
    wsBase: 'ws://api.knx-iot.example.com',
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