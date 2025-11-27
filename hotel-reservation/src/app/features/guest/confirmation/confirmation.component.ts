// =================================================================================
// File: hotel-reservation/src/app/features/guest/confirmation/confirmation.component.ts
// =================================================================================

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex justify-center pt-20 md:pt-28">
      <div class="w-full max-w-lg md:max-w-4xl px-4 py-6">
        <!-- Confirmation Card -->
        <div class="bg-white shadow rounded-2xl p-8 text-center">
          <div class="mb-4 flex justify-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span class="text-3xl">✅</span>
            </div>
          </div>
          <h2 class="text-2xl font-bold text-green-600 md:text-3xl">
            Reservation Confirmed!
          </h2>
          <p class="text-slate-700 mt-2 md:text-lg">
            We have sent the details to your email.
          </p>
          <button
            (click)="router.navigate(['/'])"
            class="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>

        <!-- Recommendation -->
        <h3 class="mt-8 text-xl font-semibold text-slate-900">
          While you are here...
        </h3>

        <article class="mt-4 bg-white rounded-2xl shadow overflow-hidden flex flex-col md:flex-row">
          <img
            src="assets/images/cabana.jpg"
            alt="Beach Cabana"
            class="w-full md:w-1/2 h-64 md:h-auto object-cover"
          />
          <div class="p-4 md:p-6 flex flex-col justify-center md:w-1/2 text-center md:text-left">
            <h4 class="text-2xl font-bold text-slate-900">
              Private Beach Cabanas
            </h4>
            <p class="mt-1 text-slate-700">
              Relax in luxury with our exclusive beach cabanas.
            </p>
            <p class="mt-4 text-sm text-slate-600 italic">
              Ask reception for availability.
            </p>
          </div>
        </article>
      </div>
    </div>
  `,
})
export class ConfirmationComponent {
  constructor(public router: Router) {}
}
