import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { interval, Subscription } from 'rxjs';

interface Restaurant {
  id: string;
  nameKey: string;
  descKey: string;
  image: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="flex justify-center min-h-screen p-6 pt-24 md:pt-28 bg-white">
      <div class="max-w-7xl mx-auto w-full p-0 space-y-16">
        <!-- Gallery Slideshow -->
        <div class="mb-16 bg-gradient-to-b from-[#f8fafc] to-[#eef2f7] rounded-2xl">
          <div
            class="relative w-full overflow-hidden rounded-2xl shadow-lg h-[520px] md:h-[720px] lg:h-[820px]"
          >
            <!-- Slider Track -->
            <div
              class="flex h-full will-change-transform transition-transform duration-[1000ms] ease-in-out"
              [style.transform]="'translateX(-' + currentIndex() * 100 + '%)'"
            >
              @for (img of images; track $index) {
              <img
                [src]="img"
                class="flex-shrink-0 w-full h-full object-cover"
                alt="Gallery"
                loading="lazy"
              />
              }
            </div>

            <!-- Overlay -->
            <div
              class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-2xl"
            ></div>

            <!-- Hero Text -->
            <div class="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white">
              <h1 class="text-3xl md:text-5xl font-bold drop-shadow-sm">
                {{ 'welcome_message' | translate }}
              </h1>
              <p class="mt-2 md:mt-3 text-sm md:text-base max-w-2xl drop-shadow-sm">
                {{ 'welcome_sub' | translate }}
              </p>
              <div class="mt-4 md:mt-6">
                <button
                  (click)="scrollToRestaurants()"
                  class="pointer-events-auto inline-flex items-center gap-2 bg-orange-700 hover:bg-orange-600 text-white font-semibold px-5 py-3 rounded-full shadow"
                >
                  {{ 'Button' | translate }}
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Restaurants Grid -->
        <section #restaurantSection class="bg-white rounded-3xl p-8 md:p-10 shadow-xl">
          <h2 class="text-3xl md:text-4xl font-bold text-center mb-10">
            {{ 'pick_restaurant' | translate }}
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (item of restaurants; track item.id) {
            <button
              (click)="navigateToReservation(item.id)"
              [disabled]="item.disabled"
              class="group relative w-full rounded-3xl border border-gray-200 bg-white text-left overflow-hidden transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div
                class="aspect-[4/3] bg-white overflow-hidden ring-1 ring-slate-100 rounded-t-3xl"
              >
                <img
                  [src]="item.image"
                  class="h-full w-full object-contain p-6 transition duration-300 group-hover:scale-[1.03]"
                  [alt]="item.nameKey | translate"
                />
              </div>
              <div class="p-6">
                @if (item.disabled) {
                <h3 class="text-xl font-bold text-gray-800">
                  {{ 'fish_reservation_heading' | translate }}
                </h3>
                <p class="text-gray-500 italic mt-1">
                  {{ 'fish_reservation_subtext' | translate }}
                </p>
                } @else {
                <h3 class="text-xl font-bold text-gray-800">{{ item.nameKey | translate }}</h3>
                <p class="text-gray-500 mt-1">{{ item.descKey | translate }}</p>
                <div class="mt-4">
                  <span
                    class="inline-flex items-center px-4 py-2 rounded-full bg-orange-700 text-white text-sm font-semibold group-hover:bg-orange-600"
                  >
                    {{ 'reserve_now' | translate }}
                  </span>
                </div>
                }
              </div>
            </button>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('restaurantSection') restaurantSection!: ElementRef;

  currentIndex = signal(0);
  images = Array.from({ length: 7 }, (_, i) => `/gallery/${i + 1}.jpg`);
  private timerSub?: Subscription;

  restaurants: Restaurant[] = [
    { id: 'Indian', nameKey: 'indian_name', descKey: 'indian_desc', image: 'assets/images/indian.png' },
    {
      id: 'Chinese',
      nameKey: 'chinese_name',
      descKey: 'chinese_desc',
      image: 'assets/images/chinese.png',
    },
    {
      id: 'Italian',
      nameKey: 'italian_name',
      descKey: 'italian_desc',
      image: 'assets/images/italian.png',
    },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.timerSub = interval(3000).subscribe(() => {
      this.currentIndex.update((i) => (i + 1) % this.images.length);
    });
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
}
