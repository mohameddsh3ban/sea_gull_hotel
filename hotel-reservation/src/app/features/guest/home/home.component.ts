// =================================================================================
// File: hotel-reservation/src/app/features/guest/home/home.component.ts
// =================================================================================

import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { Restaurant } from '../../../core/models/restaurant.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LoadingSpinner],
  template: `
    <div class="flex flex-col min-h-screen bg-gray-50">
      
      <!-- HERO SECTION -->
      <div class="relative w-full h-[85vh] md:h-[800px] overflow-hidden">
        <div class="absolute inset-0">
             <div
              class="flex h-full w-full transition-transform duration-[1500ms] ease-in-out will-change-transform"
              [style.transform]="'translateX(-' + currentIndex() * 100 + '%)'"
            >
              @for (img of images; track $index) {
              <div class="w-full h-full flex-shrink-0 relative">
                 <img [src]="img" class="w-full h-full object-cover" alt="Resort View" loading="lazy" />
                 <div class="absolute inset-0 bg-black/40"></div> 
              </div>
              }
            </div>
        </div>

        <div class="absolute inset-0 flex items-center justify-center text-center px-4 z-10">
          <div class="max-w-4xl space-y-6 animate-fade-in">
             <span class="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur text-white text-sm font-semibold tracking-wider uppercase border border-white/30 mb-2">
               Welcome to Paradise
             </span>
             <h1 class="text-5xl md:text-7xl font-bold text-white drop-shadow-lg leading-tight">
               Experience Dining <br/> <span class="text-orange-400">Reimagined</span>
             </h1>
             <p class="text-lg md:text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-md">
               Book your table at our exclusive A La Carte restaurants. 
               Manage your reservations and explore world-class cuisine effortlessly.
             </p>
             
             <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
               <button 
                 (click)="scrollToRestaurants()"
                 class="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white text-lg font-bold rounded-full transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
               >
                 Book a Table
               </button>
               
               @if (!isLoggedIn()) {
                 <button 
                   (click)="navigateToLogin()"
                   class="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/40 text-white text-lg font-bold rounded-full transition"
                 >
                   Staff Login
                 </button>
               }
             </div>
          </div>
        </div>
      </div>

      <!-- RESTAURANTS SECTION -->
      <div class="max-w-7xl mx-auto w-full px-4 sm:px-6 py-20 -mt-20 relative z-20">
        <section #restaurantSection class="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl border border-gray-100">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900">
              Pick Your Restaurant
            </h2>
            <p class="text-gray-500 mt-3">Select a venue to check availability and menu</p>
          </div>

          @if (loading()) {
            <app-loading-spinner />
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              @for (item of restaurants(); track item.id) {
              <button
                (click)="navigateToReservation(item.id)"
                [disabled]="!item.isActive"
                class="group flex flex-col w-full h-full text-left rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 transition hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <!-- Card Image -->
                <div class="aspect-[4/3] w-full overflow-hidden relative">
                   <img
                    [src]="item.media.cardImage"
                    class="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    [alt]="item.name"
                  />
                  @if (!item.isActive) {
                    <div class="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                      <span class="text-white font-bold px-3 py-1 border border-white rounded">CLOSED</span>
                    </div>
                  }
                </div>
                
                <!-- Card Content -->
                <div class="p-5 flex-1 flex flex-col">
                  <h3 class="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {{ item.name }}
                  </h3>
                  <p class="text-sm text-gray-500 mt-2 line-clamp-2 flex-1">
                    {{ item.description }}
                  </p>
                  
                  <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {{ item.config.openingTime }} - {{ item.config.closingTime }}
                    </span>
                    <span class="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      ➜
                    </span>
                  </div>
                </div>
              </button>
              }
            </div>
          }
        </section>
      </div>
      
      <!-- Features -->
      <div class="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8 text-center">
         <div class="p-6">
           <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📅</div>
           <h3 class="text-xl font-bold text-gray-800 mb-2">Instant Booking</h3>
           <p class="text-gray-600">Real-time availability checks for all our restaurants.</p>
         </div>
         <div class="p-6">
           <div class="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🍣</div>
           <h3 class="text-xl font-bold text-gray-800 mb-2">Menu & Upsells</h3>
           <p class="text-gray-600">Pre-order special items like Sushi directly from the app.</p>
         </div>
         <div class="p-6">
           <div class="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">⭐</div>
           <h3 class="text-xl font-bold text-gray-800 mb-2">Feedback Loop</h3>
           <p class="text-gray-600">Share your dining experience to help us serve you better.</p>
         </div>
      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 1s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('restaurantSection') restaurantSection!: ElementRef;

  currentIndex = signal(0);
  images = [
    'assets/images/hotel-hero.jpg',
    'assets/images/italian-cover.jpg',
    'assets/images/chinese-cover.jpg'
  ];
  private timerSub?: Subscription;

  restaurants = signal<Restaurant[]>([]);
  loading = signal(true);
  isLoggedIn = signal(false);

  constructor(
    private router: Router,
    private restaurantService: RestaurantService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.timerSub = interval(5000).subscribe(() => {
      this.currentIndex.update((i) => (i + 1) % this.images.length);
    });

    this.restaurantService.getAll().subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load restaurants', err);
        this.loading.set(false);
      }
    });
    
    this.isLoggedIn.set(!!this.authService.user());
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
  }

  scrollToRestaurants() {
    this.restaurantSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  navigateToReservation(id: string) {
    this.router.navigate(['/reservation', id]);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
