import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-[#5f5d5c] text-white text-sm py-10 mt-10">
      <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex-1 text-center md:text-left">
          <p>Need help? <a href="mailto:info@hurghadaseagull.com" class="underline hover:text-gray-300">info&#64;hurghadaseagull.com</a></p>
        </div>
        <div class="flex-1 text-center">
          <p class="text-gray-300 text-sm">&copy; 2025 Seagull Beach Resort. All rights reserved.</p>
        </div>
        <div class="flex-1 text-center md:text-right">
          <p><a href="https://instagram.com/seagullbeachresorthrg" target="_blank" rel="noopener noreferrer" class="underline hover:text-gray-300">&#64;seagullbeachresorthrg</a></p>
        </div>
      </div>
    </footer>
  `,
  styles: [],
})
export class Footer {}
