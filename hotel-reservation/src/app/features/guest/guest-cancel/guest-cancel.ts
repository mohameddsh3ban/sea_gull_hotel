import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

type PageStatus = 'loading' | 'confirm' | 'success' | 'error';

@Component({
  selector: 'app-guest-cancel',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinner],
  templateUrl: './guest-cancel.html',
})
export class GuestCancel implements OnInit {
  status = signal<PageStatus>('loading');
  reservation = signal<Reservation | null>(null);
  token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token');
    
    if (!this.token) {
      this.status.set('error');
      return;
    }

    this.reservationService.getByToken(this.token).subscribe({
      next: (res: Reservation) => {
        this.reservation.set(res);
        this.status.set('confirm');
      },
      error: () => this.status.set('error')
    });
  }

  confirmCancellation() {
    if (!this.token) return;
    
    this.status.set('loading');
    this.reservationService.cancel(this.token).subscribe({
      next: () => this.status.set('success'),
      error: () => this.status.set('error')
    });
  }
}
