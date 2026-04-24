import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../core/services/ticket.service';
import { TicketResponse, StatusResponse } from '../../core/models/entities';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './tickets.html',
  styleUrl: './tickets.scss'
})
export class TicketsComponent implements OnInit {
  private ticketService = inject(TicketService);

  tickets: TicketResponse[] = [];
  statuses: StatusResponse[] = [];
  isLoading = true;
  
  searchTerm = '';
  selectedStatus: number | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.ticketService.getStatuses().subscribe((s) => this.statuses = s);
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.tickets = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.isLoading = false;
      }
    });
  }

  get filteredTickets() {
    return this.tickets.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                           t.key.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.selectedStatus || t.status.id === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  getPriorityBadgeClass(priority: string): string {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'crítica':
      case 'urgent': return 'bg-danger text-white';
      case 'alta':
      case 'high': return 'bg-warning text-dark';
      case 'media':
      case 'medium': return 'bg-primary text-white';
      default: return 'bg-secondary text-white';
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
}