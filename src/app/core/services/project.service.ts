import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ProjectResponse,
  CreateProject,
  UpdateProject,
  ProjectMemberResponse,
  CreateProjectMember,
  UpdateProjectMember,
  StatusProject,
  ActivityProject,
  DueTickets,
  ProjectMemberWithUser
} from '../models/entities';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/project`;
  private apiUrlTicket = `${environment.apiUrl}/ticket`;

  getProjects(params?: {
    page?: number;
    page_size?: number;
    search_term?: string;
    paginate?: boolean;
  }): Observable<PaginatedResponse<ProjectResponse>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.page_size) httpParams = httpParams.set('page_size', params.page_size.toString());
      if (params.search_term) httpParams = httpParams.set('search_term', params.search_term);
      if (params.paginate === false) httpParams = httpParams.set('paginate', 'false');
    }

    console.log('Calling getProjects with URL:', `${this.apiUrl}/list/`, 'params:', httpParams.toString());
    
    return this.http.get<PaginatedResponse<ProjectResponse>>(`${this.apiUrl}/list/`, { params: httpParams });
  }

  getProject(id: number): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.apiUrl}/${id}/`);
  }

  createProject(project: CreateProject): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.apiUrl}/create/`, project);
  }

  updateProject(id: number, project: UpdateProject): Observable<ProjectResponse> {
    return this.http.put<ProjectResponse>(`${this.apiUrl}/update/${id}/`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  getMembers(projectId: number): Observable<ProjectMemberWithUser[]> {
    return this.http.get<ProjectMemberWithUser[]>(`${this.apiUrl}/${projectId}/members/`);
  }

  addMember(projectId: number, member: { user: number; role: string }): Observable<ProjectMemberResponse> {
    return this.http.post<ProjectMemberResponse>(`${this.apiUrl}/members/add/${projectId}/`, member);
  }

  removeMember(projectId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/member/${memberId}/delete/`);
  }

  updateMemberRole(projectId: number, memberId: number, role: { role: string }): Observable<ProjectMemberResponse> {
    return this.http.patch<ProjectMemberResponse>(`${this.apiUrl}/${projectId}/member/${memberId}/update/`, role);
  }

  deleteProjects(ids: number[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/delete/`, { ids });
  }

  getProjectStatus(projectId: number): Observable<StatusProject> {
    return this.http.get<StatusProject>(`${this.apiUrl}/status_project/${projectId}/`);
  }

  getRecentActivity(projectId: number): Observable<ActivityProject[]> {
    return this.http.get<ActivityProject[]>(`${this.apiUrl}/${projectId}/recent_activity/`);
  }

  getDueTickets(projectId: number): Observable<DueTickets[]> {
    return this.http.get<DueTickets[]>(`${this.apiUrlTicket}/project/${projectId}/due_tickets/`);
  }
}