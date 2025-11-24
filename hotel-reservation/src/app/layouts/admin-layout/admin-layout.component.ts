import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminHeader } from '../../shared/components/admin-header/admin-header';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminHeader],
  template: `
    <div class="flex flex-col min-h-screen">
      <app-admin-header />
      <main class="flex-grow bg-gray-100">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {}
