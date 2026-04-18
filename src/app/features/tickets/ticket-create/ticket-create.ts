import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { CreateTicket, TicketResponse, StatusResponse } from '../../../core/models/entities';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-create.html'
})
export class TicketCreateComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);

  @Input() projectId!: number;
  @Input() statuses: StatusResponse[] = [];
  @Input() initialStatusId: number | null = null;
  @Input() editingTicket: TicketResponse | null = null;
  @Output() ticketCreated = new EventEmitter<TicketResponse>();
  @Output() ticketUpdated = new EventEmitter<TicketResponse>();
  @Output() close = new EventEmitter<void>();

  ticketForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: ['', [Validators.required]],
    priority: ['medium', [Validators.required]],
    type: ['task', [Validators.required]],
    summary: ['', [Validators.required, Validators.minLength(10)]],
    suggested_solution: ['', [Validators.required]]
  });

  isLoading = false;
  isAiGenerating = false;
  errorMessage = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingTicket'] && this.editingTicket) {
      this.ticketForm.patchValue({
        title: this.editingTicket.title,
        description: this.editingTicket.description,
        category: this.editingTicket.category,
        priority: this.editingTicket.priority,
        type: this.editingTicket.type,
        summary: this.editingTicket.summary,
        suggested_solution: this.editingTicket.suggested_solution
      });
    } else if (changes['editingTicket'] && !this.editingTicket) {
      this.ticketForm.reset({
        priority: 'medium',
        type: 'task'
      });
    }
  }

  onSubmit() {
    if (this.ticketForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const statusId = this.initialStatusId || this.statuses[0]?.id || 1;
      
      if (this.editingTicket) {
        this.ticketService.updateTicket(this.editingTicket.id, this.ticketForm.value).subscribe({
          next: (ticket) => {
            this.ticketUpdated.emit(ticket);
            this.isLoading = false;
            this.closeModal();
          },
          error: (err: any) => {
            this.isLoading = false;
            this.errorMessage = 'Error al actualizar el ticket. Intente de nuevo.';
            console.error(err);
          }
        });
      } else {
        const ticketData: CreateTicket = {
          ...this.ticketForm.value,
          project: this.projectId,
          status: statusId,
          labels: []
        };

        this.ticketService.createTicket(ticketData).subscribe({
          next: (ticket) => {
            this.ticketCreated.emit(ticket);
            this.isLoading = false;
            this.closeModal();
          },
          error: (err: any) => {
            this.isLoading = false;
            this.errorMessage = 'Error al crear el ticket. Intente de nuevo.';
            console.error(err);
          }
        });
      }
    } else {
      this.ticketForm.markAllAsTouched();
    }
  }

  generateWithAi() {
    const description = this.ticketForm.get('description')?.value;
    if (!description || description.length < 10) {
      alert('Por favor, ingresa una descripción más detallada para que la IA pueda trabajar.');
      return;
    }

    this.isAiGenerating = true;
    setTimeout(() => {
      this.ticketForm.patchValue({
        summary: `Resumen IA: ${description.substring(0, 50)}...`,
        suggested_solution: 'Solución sugerida por IA: Se recomienda revisar la configuración del módulo y validar las entradas de datos según el log de errores.'
      });
      this.isAiGenerating = false;
    }, 2000);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.ticketForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  closeModal() {
    this.close.emit();
  }
}