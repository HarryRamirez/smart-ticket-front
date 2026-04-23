import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  TicketResponse,
  CreateTicket,
  UpdateTicket,
  StatusResponse,
  LabelResponse,
  CreateStatus,
  SprintResponse,
  CreateSprint,
  PaginatedBacklogResponse
} from '../models/entities';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ticket`;
  private statusUrl = `${environment.apiUrl}/status`;
  private sprintUrl = `${environment.apiUrl}/sprint`;

  getTickets(projectId?: number, statusId?: number, sprintId?: number): Observable<TicketResponse[]> {
    let params = new HttpParams();
    if (projectId) params = params.set('project', projectId.toString());
    if (statusId) params = params.set('status', statusId.toString());
    if (sprintId) params = params.set('sprint', sprintId.toString());

    return this.http.get<TicketResponse[]>(`${this.apiUrl}/`, { params });
  }

  getTicket(id: number): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.apiUrl}/${id}/`);
  }

  createTicket(ticket: CreateTicket): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.apiUrl}/`, ticket);
  }

  updateTicket(id: number, ticket: UpdateTicket): Observable<TicketResponse> {
    return this.http.patch<TicketResponse>(`${this.apiUrl}/${id}/`, ticket);
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  getStatuses(): Observable<StatusResponse[]> {
    return this.http.get<StatusResponse[]>(`${this.statusUrl}/`);
  }

  getLabels(): Observable<LabelResponse[]> {
    return this.http.get<LabelResponse[]>(`${environment.apiUrl}/labels/`);
  }

  getTicketsByProject(projectId: number): Observable<TicketResponse[]> {
    return this.http.get<TicketResponse[]>(`${this.apiUrl}/`, { params: { project: projectId.toString() } });
  }

  getStatusesByProject(projectId: number): Observable<StatusResponse[]> {
    return this.http.get<StatusResponse[]>(`${this.statusUrl}/`, { params: { project: projectId.toString() } });
  }

  createStatus(status: CreateStatus): Observable<StatusResponse> {
    return this.http.post<StatusResponse>(`${this.statusUrl}/`, status);
  }

  updateStatus(id: number, status: Partial<CreateStatus>): Observable<StatusResponse> {
    return this.http.patch<StatusResponse>(`${this.statusUrl}/${id}/`, status);
  }

  deleteStatus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.statusUrl}/${id}/`);
  }

  getSprints(projectId: number): Observable<SprintResponse[]> {
    return this.http.get<SprintResponse[]>(`${this.sprintUrl}/project/${projectId}/list`, { params: { project: projectId.toString() } });
  }

  createSprint(projectId: number, sprint: {
    name: string;
    start_date: string;
    end_date: string;
    status: 'planificado' | 'activo' | 'completado';
  }): Observable<SprintResponse> {
    return this.http.post<SprintResponse>(`${this.sprintUrl}/project/${projectId}/create/`, sprint);
  }

  updateSprint(id: number, sprint: Partial<CreateSprint>): Observable<SprintResponse> {
    return this.http.patch<SprintResponse>(`${this.sprintUrl}/${id}/`, sprint);
  }

  deleteSprint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.sprintUrl}/${id}/`);
  }

  moveTicketToStatus(ticketId: number, statusId: number): Observable<TicketResponse> {
    return this.http.patch<TicketResponse>(`${this.apiUrl}/${ticketId}/`, { status: statusId });
  }

  moveTicketToSprint(ticketId: number, sprintId: number | null): Observable<TicketResponse> {
    return this.http.patch<TicketResponse>(`${this.apiUrl}/${ticketId}/`, { sprint: sprintId });
  }

  getBacklogTickets(projectId: number, params?: {
    page?: number;
    page_size?: number;
    search_term?: string;
  }): Observable<PaginatedBacklogResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.page_size) httpParams = httpParams.set('page_size', params.page_size.toString());
      if (params.search_term) httpParams = httpParams.set('search_term', params.search_term);
    }
    return this.http.get<PaginatedBacklogResponse>(`${this.apiUrl}/project/${projectId}/backlog/`, { params: httpParams });
  }
}