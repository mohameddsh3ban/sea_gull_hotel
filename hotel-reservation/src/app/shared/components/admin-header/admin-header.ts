import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-40 bg-[#1f2937]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1f2937]/80 text-white border-b border-white/10">
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="h-20 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button (click)="navigate('/admin/dashboard')" class="flex items-center focus:outline-none">
              <img src="assets/images/seagullwhite.png" alt="Hotel Logo" class="h-12 w-auto" />
            </button>
            <span class="text-lg sm:text-xl font-semibold select-none"> Admin Panel </span>
          </div>

          <nav class="hidden md:flex items-center gap-2">
            <a routerLink="/admin/dashboard" routerLinkActive="bg-white text-[#0f172a]" [routerLinkActiveOptions]="{ exact: true }" [class]="linkBase">Dashboard</a>
            <a routerLink="/admin/manage-capacities" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase">Manage Capacities</a>
            <a routerLink="/admin/capacity-overview" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase">Capacity Overview</a>
            <a routerLink="/admin/reviews" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase">Reviews</a>
            <a routerLink="/admin/settings" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase">Settings</a>
            <a routerLink="/admin/analytics" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase">Analytics</a>
            <button (click)="handleLogout()" class="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-red-500/90 hover:bg-red-500">Logout</button>
          </nav>

          <button (click)="toggleMenu()" class="md:hidden inline-flex items-center justify-center rounded-md p-2 text-white/90 hover:text-white hover:bg-white/10">
            <svg [class.hidden]="open()" [class.block]="!open()" class="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
            <svg [class.block]="open()" [class.hidden]="!open()" class="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          </button>
        </div>
      </div>

      @if (open()) {
      <div class="md:hidden border-t border-white/10">
        <div class="px-4 py-3 space-y-1">
          <a routerLink="/admin/dashboard" routerLinkActive="bg-white text-[#0f172a]" [routerLinkActiveOptions]="{ exact: true }" [class]="linkBase" (click)="closeMenu()">Dashboard</a>
          <a routerLink="/admin/manage-capacities" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase" (click)="closeMenu()">Manage Capacities</a>
          <a routerLink="/admin/capacity-overview" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase" (click)="closeMenu()">Capacity Overview</a>
          <a routerLink="/admin/reviews" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase" (click)="closeMenu()">Reviews</a>
          <a routerLink="/admin/settings" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase" (click)="closeMenu()">Settings</a>
          <a routerLink="/admin/analytics" routerLinkActive="bg-white text-[#0f172a]" [class]="linkBase" (click)="closeMenu()">Analytics</a>
          <button (click)="handleLogoutAndClose()" class="w-full text-left mt-1 px-3 py-2 rounded-md text-sm font-medium bg-red-500/90 hover:bg-red-500">Logout</button>
        </div>
      </div>
      }
    </header>
  `,
  styles: [],
})
export class AdminHeader {
  open = signal(false);
  linkBase = 'px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 text-white/90 hover:text-white hover:bg-white/10';

  constructor(private router: Router, private authService: AuthService) {}

  navigate(path: string) { this.router.navigate([path]); }
  toggleMenu() { this.open.update((v) => !v); }
  closeMenu() { this.open.set(false); }

  async handleLogout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      this.router.navigate(['/login']);
    }
  }

  async handleLogoutAndClose() {
    this.closeMenu();
    await this.handleLogout();
  }
}
