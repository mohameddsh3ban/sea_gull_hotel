// =================================================================================
// File: hotel-reservation/src/app/features/guest/about/about.component.ts
// =================================================================================

import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  template: `
    <div class="max-w-4xl mx-auto p-8 bg-white mt-10 rounded-xl shadow pt-24 md:pt-28">
      <h1 class="text-3xl font-bold mb-4 text-gray-800">
        Ala Carte Restaurants at Seagull Beach Resort
      </h1>
      <p class="text-gray-600 mb-4">
        Nestled on the shores of the Red Sea in Hurghada, Seagull Beach Resort is a family-friendly
        hotel offering world-class service and unforgettable dining experiences.
      </p>
      <p class="text-gray-600">
        Our all-inclusive resort features four exquisite restaurants — each representing a global
        culinary tradition.
      </p>

      <div class="mt-10">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">
          Our Restaurants (All restaurants start operating at 19:00)
        </h2>

        <div class="space-y-6">
          <div>
            <h3 class="text-xl font-bold text-gray-700 mb-1">🍤 Seafood Restaurant</h3>
            <p class="text-gray-600">
              Dive into the freshest catch of the day with Red Sea flavors, all enjoyed with a view
              of the Sea.
            </p>
          </div>

          <div>
            <h3 class="text-xl font-bold text-gray-700 mb-1">🥢 Chinese Restaurant</h3>
            <p class="text-gray-600">
              Explore bold Asian flavors like sweet & sour chicken and steamed dumplings, prepared
              using traditional techniques.
            </p>
          </div>

          <div>
            <h3 class="text-xl font-bold text-gray-700 mb-1">🍝 Italian Restaurant</h3>
            <p class="text-gray-600">
              Enjoy hand-tossed pizzas, creamy pastas, and classic Italian hospitality in a relaxed
              setting.
            </p>
          </div>

          <div>
            <h3 class="text-xl font-bold text-gray-700 mb-1">🌶 Indian Restaurant</h3>
            <p class="text-gray-600">
              Taste the vibrant spices of India with rich curries and sizzling tandoori dishes in a
              cozy, colorful setting.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AboutComponent {}
