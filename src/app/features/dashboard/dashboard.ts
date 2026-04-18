import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { TicketService } from '../../core/services/ticket.service';
import { ProjectResponse, TicketResponse } from '../../core/models/entities';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private projectService = inject(ProjectService);
  private ticketService = inject(TicketService);

  projects: ProjectResponse[] = [];
  recentTickets: TicketResponse[] = [];
  allTickets: TicketResponse[] = [];
  showActivityModal = false;
  isLoading = true;
  
  stats = {
    total: 0,
    pending: 0,
    resolved: 0,
    urgent: 0
  };

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    forkJoin({
      projects: this.projectService.getProjects({ paginate: false }),
      tickets: this.ticketService.getTickets()
    }).subscribe({
      next: (data) => {
        this.projects = data.projects.results;
        this.allTickets = data.tickets;
        this.recentTickets = data.tickets.slice(0, 5);
        this.calculateStats(data.tickets);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.isLoading = false;
      }
    });
  }

  calculateStats(tickets: TicketResponse[]) {
    this.stats.total = tickets.length;
    this.stats.pending = tickets.filter(t => t.status.name !== 'Done' && t.status.name !== 'Closed').length;
    this.stats.resolved = tickets.filter(t => t.status.name === 'Done' || t.status.name === 'Closed').length;
    this.stats.urgent = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'urgent': return 'text-danger fw-bold';
      case 'high': return 'text-warning fw-bold';
      case 'medium': return 'text-primary';
      default: return 'text-muted';
    }
  }

  getStatusBadgeClass(statusName: string): string {
    switch (statusName.toLowerCase()) {
      case 'done':
      case 'completado':
        return 'bg-success text-white';
      case 'in progress':
      case 'en progreso':
        return 'bg-primary text-white';
      case 'to do':
      case 'por hacer':
        return 'bg-secondary text-white';
      default:
        return 'bg-light text-dark';
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.showActivityModal) {
      this.closeActivityModal();
    }
  }

  openActivityModal() {
    this.showActivityModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeActivityModal() {
    this.showActivityModal = false;
    document.body.style.overflow = '';
  }
}