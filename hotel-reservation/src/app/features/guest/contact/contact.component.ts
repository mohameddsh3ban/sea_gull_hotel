import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="max-w-4xl mx-auto p-8 bg-white mt-10 rounded-xl shadow pt-24 md:pt-28">
      <h1 class="text-3xl font-bold mb-4 text-gray-800">Contact Us</h1>
      <p class="text-gray-600 mb-4">
        If you have any questions, inquiries, or need assistance during your stay, feel free to
        reach out to us.
      </p>
      <ul class="text-gray-600 space-y-2">
        <li><strong>Email:</strong> info&#64;hurghadaseagull.com</li>
        <li><strong>Phone:</strong> +20 65 344 9600</li>
        <li><strong>Instagram:</strong> &#64;seagullbeachresorthrg</li>
      </ul>
    </div>
  `,
})
export class ContactComponent {}
