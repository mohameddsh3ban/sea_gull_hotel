import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-upload-guest-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-guest-list.html',
})
export class UploadGuestList {
  file: File | null = null;
  message = signal('');
  isUploading = signal(false);
  isSuccess = signal(false);

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      this.message.set('');
      this.isSuccess.set(false);
    }
  }

  handleUpload(event: Event) {
    event.preventDefault();
    if (!this.file) {
      this.message.set('Please select a file first.');
      this.isSuccess.set(false);
      return;
    }

    this.isUploading.set(true);
    this.message.set('');

    const formData = new FormData();
    formData.append('file', this.file);

    this.http.post<{ message: string }>(`${environment.apiUrl}/api/v1/upload-guestlist`, formData)
      .subscribe({
        next: (res) => {
          this.message.set(`✅ ${res.message}`);
          this.isSuccess.set(true);
          this.isUploading.set(false);
          this.file = null; // Reset
        },
        error: (err) => {
          console.error(err);
          this.message.set(`❌ Error: ${err.error?.detail || 'Upload failed'}`);
          this.isSuccess.set(false);
          this.isUploading.set(false);
        }
      });
  }
}
