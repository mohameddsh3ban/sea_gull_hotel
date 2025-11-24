import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="fixed top-0 left-0 right-0 z-50 bg-gray-800 shadow px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="assets/images/seagullwhite.png" alt="BookEasy" class="h-10 w-auto" />
        <span class="font-semibold text-white">BookEasy</span>
      </div>
      <button (click)="handleLogout()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-sm">Logout</button>
    </header>
  `,
  styles: [],
})
export class DashboardHeader {
  constructor(private router: Router, private authService: AuthService) {}

  async handleLogout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      this.router.navigate(['/login']);
    }
  }
}
