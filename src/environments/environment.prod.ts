export const environment = {
    production: true,
    apiBase: 'https://api.knx-iot.example.com',
    wsBase: 'wss://api.knx-iot.example.com',
    clientId: 'knx-frontend-prod',
    clientSecret: '', // Via env var in Docker
    tokenEndpoint: '/oauth/access',
    discoveryUrl: '/.well-known/knx',
    logging: {
        enableConsole: false,
        enableStorage: true,
        logLevel: 'error'
    },
    features: {
        enableMockData: false,
        enableDevTools: false,
        enablePerformanceMonitoring: false
    }
};
