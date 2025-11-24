import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../shared/components/header/header';
import { Footer } from '../../shared/components/footer/footer';

@Component({
  selector: 'app-guest-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  template: `
    <div class="flex flex-col min-h-screen">
      <app-header />
      <main class="flex-grow bg-gray-100">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
})
export class GuestLayoutComponent {}
