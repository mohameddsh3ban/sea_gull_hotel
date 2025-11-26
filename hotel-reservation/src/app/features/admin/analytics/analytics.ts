import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
})
export class Analytics implements OnInit {
  loading = signal(true);
  data: any = null;

  public lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true }, tooltip: { mode: 'index', intersect: false } }
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/api/v1/analytics/dashboard`).subscribe({
      next: (res) => {
        this.data = res;
        this.setupCharts(res.charts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  setupCharts(charts: any) {
    const timeline = charts.timeline || [];
    const labels = timeline.map((d: any) => d.date);

    this.lineChartData = {
      labels: labels,
      datasets: [
        { data: timeline.map((d: any) => d.guests), label: 'Total Guests', fill: true, tension: 0.4, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }
      ]
    };

    this.barChartData = {
      labels: labels,
      datasets: [
        { data: timeline.map((d: any) => d.revenue), label: 'Upsell Revenue ($)', backgroundColor: '#10b981' }
      ]
    };
  }
}
