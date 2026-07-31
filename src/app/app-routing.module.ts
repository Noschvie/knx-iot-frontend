import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { SetupWizardComponent } from './features/auth/setup-wizard.component';
import { MainLayoutComponent } from './features/layout/main-layout.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'setup',
        component: SetupWizardComponent
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'dashboard',
                loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
            },
            {
                path: 'monitor',
                loadChildren: () => import('./features/monitor/monitor.module').then(m => m.MonitorModule)
            },
            {
                path: 'datapoints',
                loadChildren: () => import('./features/datapoints/datapoints.module').then(m => m.DatapointsModule)
            },
            {
                path: 'devices',
                loadChildren: () => import('./features/devices/devices.module').then(m => m.DevicesModule)
            },
            {
                path: 'locations',
                loadChildren: () => import('./features/locations/locations.module').then(m => m.LocationsModule)
            },
            {
                path: 'functions',
                loadChildren: () => import('./features/functions/functions.module').then(m => m.FunctionsModule)
            },
            {
                path: 'charts',
                loadChildren: () => import('./features/charts/charts.module').then(m => m.ChartsModule)
            },
            {
                path: 'history',
                loadChildren: () => import('./features/history/history.module').then(m => m.HistoryModule)
            },
            {
                path: 'logs',
                loadChildren: () => import('./features/logs/logs.module').then(m => m.LogsModule)
            },
            {
                path: 'settings',
                loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule)
            }
        ]
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
        enableTracing: false, // Set to true for debugging
        useHash: false,
        scrollPositionRestoration: 'top'
    })],
    exports: [RouterModule]
})
export class AppRoutingModule {}
