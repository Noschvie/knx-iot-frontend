export const environment = {
    production: true,
    apiBase: 'https://api.knx-iot.example.com',
    wsBase: 'wss://api.knx-iot.example.com',
    clientId: 'knx-default-client',
    clientSecret: 'change-me-in-production',
    tokenEndpoint: '/oauth/access',
    discoveryUrl: '/.well-known/knx',
    logging: {
        enableConsole: false,
        enableStorage: true,
        logLevel: 'error'
    },
    features: {
        enableMockData: true,
        enableDevTools: false,
        enablePerformanceMonitoring: false
    }
};
