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

  categories = ['Backend', 'Frontend', 'BaseDatos', 'Integraciones', 'UIUX', 'Documentacion', 'General'];
  priorities = ['Crítica', 'Alta', 'Media', 'Baja', 'Muy_baja'];
  types = ['Bug', 'Tarea', 'Historia', 'Mejora', 'Épica'];

  ticketForm: FormGroup = this.fb.group({
    key: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: ['', [Validators.required]],
    priority: ['', [Validators.required]],
    type: ['', [Validators.required]],
    summary: [''],
    suggested_solution: [''],
    due_date: ['', [Validators.required]]
  });

  isLoading = false;
  isAiGenerating = false;
  errorMessage = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingTicket'] && this.editingTicket) {
      this.ticketForm.patchValue({
        key: this.editingTicket.key,
        title: this.editingTicket.title,
        description: this.editingTicket.description,
        category: this.editingTicket.category,
        priority: this.editingTicket.priority,
        type: this.editingTicket.type,
        summary: this.editingTicket.summary || '',
        suggested_solution: this.editingTicket.suggested_solution || '',
        due_date: this.editingTicket.due_date ? this.editingTicket.due_date.split('T')[0] : ''
      });
    } else if (changes['editingTicket'] && !this.editingTicket) {
      this.ticketForm.reset({
        key: '',
        title: '',
        description: '',
        category: '',
        priority: '',
        type: '',
        summary: '',
        suggested_solution: '',
        due_date: ''
      });
    }
  }

  onSubmit() {
    if (this.ticketForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const statusId = this.initialStatusId || this.statuses[0]?.id || 1;
      const formValue = this.ticketForm.value;
      
      if (this.editingTicket) {
        this.ticketService.updateTicket(this.editingTicket.id, formValue).subscribe({
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
          key: formValue.key,
          title: formValue.title,
          description: formValue.description,
          category: formValue.category,
          priority: formValue.priority,
          type: formValue.type,
          summary: formValue.summary || '',
          suggested_solution: formValue.suggested_solution || '',
          due_date: formValue.due_date || ''
        };

        this.ticketService.createTicket(this.projectId, ticketData).subscribe({
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
    const title = this.ticketForm.get('title')?.value;
    const description = this.ticketForm.get('description')?.value;
    
    if (!title || title.length < 5) {
      this.errorMessage = 'Por favor, ingresa un título válido (mín. 5 caracteres) antes de generar con IA.';
      return;
    }
    
    if (!description || description.length < 10) {
      this.errorMessage = 'Por favor, ingresa una descripción más detallada para que la IA pueda trabajar.';
      return;
    }

    this.isAiGenerating = true;
    this.errorMessage = '';
    
    this.ticketService.generateTicketWithAi(title, description).subscribe({
      next: (response) => {
        this.ticketForm.patchValue({
          category: response.category,
          priority: response.priority,
          type: response.type,
          summary: response.summary,
          suggested_solution: response.suggested_solution
        });
        this.isAiGenerating = false;
      },
      error: (err) => {
        this.isAiGenerating = false;
        this.errorMessage = 'Error al generar con IA. Intenta de nuevo.';
        console.error(err);
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.ticketForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  closeModal() {
    this.close.emit();
  }
}