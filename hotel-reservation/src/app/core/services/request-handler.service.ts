import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface RequestBuilder {
  execute<T = any>(): Observable<T>;
  setBody(body: any): RequestBuilder;
  withoutAuth(): RequestBuilder;
}

@Injectable({
  providedIn: 'root',
})
export class RequestHandlerService {
  private http = inject(HttpClient);

  requestBuilder(method: string, endpoint: string): RequestBuilder {
    let body: any = null;
    let skipAuth = false;
    const http = this.http; // Capture http reference

    const builder: RequestBuilder = {
      setBody(data: any) {
        body = data;
        return builder;
      },
      withoutAuth() {
        skipAuth = true;
        return builder;
      },
      execute<T = any>(): Observable<T> {
        const url = `${environment.apiUrl}/${endpoint}`;
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });

        switch (method.toUpperCase()) {
          case 'GET':
            return http.get<T>(url, { headers });
          case 'POST':
            return http.post<T>(url, body, { headers });
          case 'PUT':
            return http.put<T>(url, body, { headers });
          case 'DELETE':
            return http.delete<T>(url, { headers });
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }
      },
    };

    return builder;
  }
}
