import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="relative min-h-screen flex items-center justify-center">
      <div class="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <img src="assets/images/seagullwhite.png" alt="Seagull" class="h-20 md:h-24 w-auto" />
      </div>
      <img src="assets/images/hotel-hero.jpg" alt="Reservation system" class="absolute inset-0 h-full w-full object-cover" />
      <div class="absolute inset-0 bg-black/60"></div>
      <div class="relative z-10 w-full max-w-6xl px-4 py-10 md:py-16">
        <div class="grid gap-10 md:grid-cols-12 items-center">
          <div class="md:col-span-6 text-white">
            <h2 class="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
              Seamless reservations for <span class="text-blue-300">Restaurants</span>
            </h2>
            <p class="mt-4 text-lg leading-relaxed text-gray-100 drop-shadow">
              Manage bookings, covers, capacities, and guest lists — all from one elegant dashboard.
            </p>
          </div>
          <div class="md:col-span-6 flex justify-center">
            <div class="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl p-6 md:p-8">
              <div class="mb-6 text-center">
                <span class="text-2xl font-bold tracking-wide text-blue-700"> BookEasy </span>
              </div>
              <div class="space-y-6">
                <router-outlet></router-outlet>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AuthLayout {}
