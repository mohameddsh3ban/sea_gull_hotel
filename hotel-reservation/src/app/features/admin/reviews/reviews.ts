import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner],
  templateUrl: './reviews.html',
})
export class Reviews implements OnInit {
  loading = signal(true);
  reviews: any[] = [];
  summary: any = { count: 0, avg: 0, histogram: {} };
  
  // Filters
  restaurantId = 'Italian';
  sort = 'newest';
  limit = 10;
  periodDays = 90;
  
  showBreakdown = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const apiUrl = `${environment.apiUrl}/api/v1`;

    // 1. Get Summary
    const summaryReq = this.http.get(`${apiUrl}/reviews/summary?restaurantId=${this.restaurantId}&period_days=${this.periodDays}`);
    
    // 2. Get List
    const listReq = this.http.get<{items: any[]}>(`${apiUrl}/reviews/log?restaurantId=${this.restaurantId}&limit=${this.limit}`);

    summaryReq.subscribe({
      next: (data: any) => this.summary = data,
      error: (err: any) => console.error('Summary failed', err)
    });

    listReq.subscribe({
      next: (data: { items: any[] }) => {
        let items = data.items || [];
        if (this.sort === 'oldest') items = items.reverse();
        this.reviews = items;
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('List failed', err);
        this.loading.set(false);
      }
    });
  }

  loadMore() {
    this.limit += 10;
    this.loadData();
  }

  getHistogramRows() {
    const hist = this.summary.histogram || {};
    return Object.keys(hist).map(k => ({ score: k, count: hist[k] })).sort((a,b) => Number(a.score) - Number(b.score));
  }

  getMaxCount() {
    const rows = this.getHistogramRows();
    return Math.max(...rows.map(r => r.count), 1);
  }
}
