import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-review-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './review-page.html',
})
export class ReviewPage {
  token: string | null = null;
  rating = signal<number>(0);
  comment = signal<string>('');
  submitting = signal<boolean>(false);
  isSubmitted = signal<boolean>(false);
  error = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private toast: ToastrService
  ) {
    this.token = this.route.snapshot.paramMap.get('token');
  }

  setRating(num: number) {
    this.rating.set(num);
    this.error.set('');
  }

  submit() {
    if (!this.token) {
      this.error.set('Invalid link.');
      return;
    }
    if (this.rating() === 0) {
      this.error.set('Please select a rating between 1 and 10.');
      return;
    }

    this.submitting.set(true);
    
    const payload = {
      token: this.token,
      rating: this.rating(),
      comment: this.comment().trim()
    };

    this.reservationService.submitReview(payload).subscribe({
      next: () => {
        this.isSubmitted.set(true);
        this.submitting.set(false);
        this.toast.success('Thank you for your feedback!');
      },
      error: (err) => {
        console.error(err);
        this.error.set(err.error?.message || 'Failed to submit review.');
        this.submitting.set(false);
      }
    });
  }
}
