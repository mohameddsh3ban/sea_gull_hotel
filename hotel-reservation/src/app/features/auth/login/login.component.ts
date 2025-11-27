// =================================================================================
// File: hotel-reservation/src/app/features/auth/login/login.component.ts
// =================================================================================

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- ... (Keep your existing template HTML) ... -->
    <!-- Just ensure the button uses [disabled]="form.invalid || isLoading()" -->
    <div
      class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50 dark:bg-gray-900"
    >
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          Sign in to your account
        </h2>
      </div>

      <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <form class="space-y-6" [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Email -->
          <div class="space-y-2">
            <label for="email" class="text-sm font-medium text-gray-700">Email address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="name@example.com"
              class="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
            @if (form.get('email')?.touched && form.get('email')?.invalid) {
            <p class="text-red-500 text-xs">Valid email is required</p>
            }
          </div>

          <!-- Password -->
      <div class="space-y-2">
        <label for="password" class="text-sm font-medium text-gray-700">Password</label>
        <div class="relative">
          <input
            id="password"
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            placeholder="Enter your password"
            class="w-full rounded-xl border border-gray-300 bg-white pl-3 pr-11 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
          />
          <button
            type="button"
            (click)="togglePassword()"
            class="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            @if (showPassword()) {
            <!-- Eye Off -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
            } @else {
            <!-- Eye -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            }
          </button>
        </div>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        [disabled]="form.invalid || isLoading()"
        class="w-full rounded-xl py-3 font-semibold text-white transition bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        {{ isLoading() ? 'Logging in...' : 'Login' }}
      </button>

      <p class="text-center text-xs text-gray-500">
        Having trouble?
        <a href="mailto:omar.modrek@hurghadaseagull.com" class="underline hover:text-gray-700"
          >Contact support</a
        >
      </p>
    </form>
  `,
})
export class LoginComponent {
  form;
  showPassword = signal(false);
  isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastrService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const { email, password } = this.form.value;

    this.auth.login({ email: email!, password: password! }).subscribe({
      next: (user) => {
        // ✅ No race condition. We have the user and role here.
        this.redirectBasedOnRole(user.role);
      },
      error: (err) => {
        this.toast.error(err.message);
        this.isLoading.set(false);
      },
      // Note: We don't set isLoading(false) in next() because we are navigating away.
    });
  }

  private redirectBasedOnRole(role: string) {
    // Define dashboard paths
    const routes: Record<string, string> = {
      admin: '/admin/dashboard',
      reception: '/reception/dashboard',
      kitchen: '/kitchen/dashboard',
      accounting: '/accounting/dashboard',
      guest: '/' // Fallback for pure guests
    };

    const path = routes[role] || '/';
    this.router.navigate([path]);
  }
}
