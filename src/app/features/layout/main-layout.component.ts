import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  labelKey: string;
  icon: string;
  route: string;
}

@Component({
  standalone: false,
  selector: 'app-main-layout',
  template: `
    <mat-sidenav-container class="layout-container">

      <!-- Sidebar -->
      <mat-sidenav #sidenav mode="side" opened class="sidebar">
        <div class="sidebar-header">
          <mat-icon class="logo-icon">hub</mat-icon>
          <span class="logo-text">{{ 'common.appName' | translate }}</span>
        </div>

        <mat-nav-list>
          <a mat-list-item
             *ngFor="let item of navItems"
             [routerLink]="item.route"
             routerLinkActive="active-link"
             [routerLinkActiveOptions]="{ exact: false }">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.labelKey | translate }}</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <!-- Main content area -->
      <mat-sidenav-content class="main-content">

        <!-- Top Bar -->
        <mat-toolbar color="primary" class="top-bar">
          <button mat-icon-button (click)="sidenav.toggle()" [attr.aria-label]="'navigation.toggle' | translate">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">{{ 'common.appTitle' | translate }}</span>
          <span class="spacer"></span>
          <button mat-icon-button [attr.aria-label]="'navigation.logout' | translate" (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>

        <!-- Page content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>

      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .layout-container {
      height: 100vh;
      background-color: #f5f5f5;
    }

    .sidebar {
      width: 220px;
      background-color: #ffffff;
      border-right: 1px solid #e0e0e0;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      background-color: #f9f9f9;
    }

    .logo-icon {
      color: #1976d2;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .logo-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1976d2;
    }

    .active-link {
      background-color: #e3f2fd !important;
      color: #1976d2 !important;
    }

    .active-link mat-icon {
      color: #1976d2;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;
    }

    .top-bar {
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .toolbar-title {
      font-size: 1rem;
      font-weight: 500;
      margin-left: 8px;
    }

    .spacer {
      flex: 1;
    }

    .page-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
  `]
})
export class MainLayoutComponent {
  navItems: NavItem[] = [
    { labelKey: 'navigation.dashboard', icon: 'dashboard',      route: '/dashboard'   },
    { labelKey: 'navigation.monitor',   icon: 'monitor_heart',  route: '/monitor'     },
    { labelKey: 'navigation.datapoints',icon: 'sensors',        route: '/datapoints'  },
    { labelKey: 'navigation.devices',   icon: 'device_hub',     route: '/devices'     },
    { labelKey: 'navigation.locations', icon: 'location_on',    route: '/locations'   },
    { labelKey: 'navigation.functions', icon: 'functions',      route: '/functions'   },
    { labelKey: 'navigation.charts',    icon: 'show_chart',     route: '/charts'      },
    { labelKey: 'navigation.history',   icon: 'history',        route: '/history'     },
    { labelKey: 'navigation.logs',      icon: 'list_alt',       route: '/logs'        },
    { labelKey: 'navigation.settings',  icon: 'settings',       route: '/settings'    },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
