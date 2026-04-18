import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserResponse } from '../models/entities';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;
  private apiUrlProject = `${environment.apiUrl}/project`;

  searchUsers(query: string, projectId: number): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrlProject}/users/search/?q=${query}&project_id=${projectId}`);
  }
}