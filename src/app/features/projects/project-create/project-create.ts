import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { CreateProject, UserResponse } from '../../../core/models/entities';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule],
  templateUrl: './project-create.html'
})
export class ProjectCreateComponent {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    key: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  selectedMembers: UserResponse[] = [];
  memberSearch = '';
  isLoading = false;
  errorMessage = '';

  mockUsers: UserResponse[] = [
    { id: 1, username: 'juan.perez', email: 'juan.perez@empresa.com', first_name: 'Juan', last_name: 'Pérez' },
    { id: 2, username: 'ana.lopez', email: 'ana.lopez@empresa.com', first_name: 'Ana', last_name: 'López' },
    { id: 3, username: 'carlos.martinez', email: 'carlos.martinez@empresa.com', first_name: 'Carlos', last_name: 'Martínez' },
    { id: 4, username: 'maria.garcia', email: 'maria.garcia@empresa.com', first_name: 'María', last_name: 'García' },
    { id: 5, username: 'admin', email: 'admin@smartticket.com', first_name: 'Admin', last_name: 'User' }
  ];

  get filteredUsers(): UserResponse[] {
    if (!this.memberSearch || this.memberSearch.length < 2) return [];
    const search = this.memberSearch.toLowerCase();
    return this.mockUsers.filter(user =>
      (user.email.toLowerCase().includes(search) || user.username.toLowerCase().includes(search)) &&
      !this.selectedMembers.some(m => m.id === user.id)
    );
  }

  addMember(user: UserResponse) {
    this.selectedMembers = [...this.selectedMembers, user];
    this.memberSearch = '';
  }

  removeMember(userId: number) {
    this.selectedMembers = this.selectedMembers.filter(m => m.id !== userId);
  }

  onSubmit() {
    if (this.projectForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const projectData: CreateProject = {
        ...this.projectForm.value,
        key: this.projectForm.value.key.toUpperCase(),
        members: this.selectedMembers.map(m => m.id)
      };

      this.projectService.createProject(projectData).subscribe({
        next: (project) => {
          this.router.navigate(['/projects', project.id]);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage = 'No se pudo crear el proyecto. Verifica la conexión con el servidor.';
          console.error(err);
        }
      });
    } else {
      this.projectForm.markAllAsTouched();
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.projectForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}