// =================================================================================
// File: hotel-reservation/src/app/shared/components/header/header.ts
// =================================================================================

import { Component, signal, OnInit, HostListener, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      [class]="headerClasses()"
      class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    >
      <div class="relative w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6">
        
        <!-- Logo / Brand -->
        <div class="flex items-center gap-2 cursor-pointer z-10" (click)="navigate('/')">
             <img [src]="logoSrc()" alt="Seagull" class="h-10 w-auto transition-all" />
             <span [class]="titleClasses()" class="font-bold tracking-tight hidden sm:block">
               Seagull Beach Resort
             </span>
        </div>

        <!-- Desktop Nav & Actions -->
        <div class="hidden md:flex items-center gap-6">
          <nav class="flex items-center gap-6">
            <span [class]="linkClasses()" (click)="navigate('/')">Home</span>
            <span [class]="linkClasses()" (click)="navigate('/about')">About</span>
            <span [class]="linkClasses()" (click)="navigate('/contact')">Contact</span>
          </nav>

          <div class="h-6 w-px bg-current opacity-20"></div>

          <!-- Auth Button -->
          @if (authService.user()) {
             <button 
              (click)="navigateToDashboard()"
              class="px-5 py-2 rounded-full font-semibold text-sm transition shadow-lg bg-orange-600 text-white hover:bg-orange-700 border-none"
             >
               Dashboard
             </button>
          } @else {
            <button 
              (click)="navigate('/login')"
              class="px-5 py-2 rounded-full font-semibold text-sm transition shadow-sm border"
              [class]="loginBtnClasses()"
             >
               Login
             </button>
          }
        </div>

        <!-- Mobile Menu Button -->
        <div class="flex md:hidden ml-auto">
          <button (click)="toggleMobileMenu()" class="focus:outline-none p-2">
             <span [class]="mobileIconClasses()">
               @if (isOpen()) {
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               } @else {
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
               }
             </span>
          </button>
        </div>
      </div>

      <!-- Mobile Menu Dropdown -->
      @if (isOpen()) {
        <div class="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 py-4 px-6 flex flex-col gap-4 animate-fade-in">
          <span class="text-gray-800 font-medium py-2 border-b border-gray-50" (click)="navigate('/')">Home</span>
          <span class="text-gray-800 font-medium py-2 border-b border-gray-50" (click)="navigate('/about')">About</span>
          <span class="text-gray-800 font-medium py-2 border-b border-gray-50" (click)="navigate('/contact')">Contact</span>
          
          @if (authService.user()) {
            <button (click)="navigateToDashboard()" class="w-full bg-orange-600 text-white py-3 rounded-xl font-bold mt-2">Go to Dashboard</button>
          } @else {
            <button (click)="navigate('/login')" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-2">Login</button>
          }
        </div>
      }
    </header>
  `,
  styles: []
})
export class Header implements OnInit {
  public authService = inject(AuthService);
  
  isOpen = signal(false);
  isScrolled = signal(false);
  isHome = signal(true);

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.isOpen.set(false);
        this.updateIsHome();
      });
  }

  ngOnInit() {
    this.updateIsHome();
    this.checkScroll();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.checkScroll();
  }

  private checkScroll() {
    if (!this.isHome()) {
      this.isScrolled.set(true);
      return;
    }
    this.isScrolled.set(window.scrollY > 20);
  }

  private updateIsHome() {
    this.isHome.set(this.router.url === '/');
  }

  effectiveScrolled = () => !this.isHome() || this.isScrolled();
  
  logoSrc = () => (this.effectiveScrolled() ? 'assets/images/seagullwhite.png' : 'assets/images/logo.png');
  headerClasses = () => `${this.effectiveScrolled() ? 'bg-[#1e293b]/95 text-white shadow-md backdrop-blur-md py-3' : 'bg-transparent text-slate-800 py-6'}`;
  titleClasses = () => `${this.effectiveScrolled() ? 'text-white' : 'text-slate-800'} text-lg`;
  linkClasses = () => `cursor-pointer font-medium transition-colors hover:opacity-70 ${this.effectiveScrolled() ? 'text-gray-100' : 'text-slate-700'}`;
  loginBtnClasses = () => `${this.effectiveScrolled() ? 'bg-white text-slate-900 hover:bg-gray-100 border-transparent' : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'}`;
  mobileIconClasses = () => `${this.effectiveScrolled() ? 'text-white' : 'text-slate-900'}`;

  navigate(path: string) { this.router.navigate([path]); }
  toggleMobileMenu() { this.isOpen.update((v) => !v); }
  
  navigateToDashboard() {
    const role = this.authService.user()?.role;
    const routes: Record<string, string> = {
      admin: '/admin/dashboard',
      reception: '/reception/dashboard',
      kitchen: '/kitchen/dashboard',
      accounting: '/accounting/dashboard'
    };
    this.navigate(routes[role || ''] || '/');
  }
}
