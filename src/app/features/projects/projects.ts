import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { ProjectResponse } from '../../core/models/entities';


@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private router = inject(Router);
  
  projects: ProjectResponse[] = [];
  isLoading = true;
  openDropdownId: string | null = null;
  showDeleteConfirm: number | null = null;
  showEditModal = false;
  editingProject: ProjectResponse | null = null;
  editProjectData = {
    name: '',
    description: '',
    key: ''
  };
  toastMessage = '';
  toastType: 'success' | 'error' | '' = '';



  ngOnInit() {
    this.loadProjects();
  }


  loadProjects() {
    this.isLoading = true;
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects = data.results;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.isLoading = false;
      }
    });
  }

  toggleDropdown(event: Event, projectId: number): void {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === 'project-' + projectId ? null : 'project-' + projectId;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.openDropdownId = null;
    }
  }

  closeDropdowns(): void {
    this.openDropdownId = null;
  }

  confirmDelete(projectId: number): void {
    this.showDeleteConfirm = projectId;
    this.closeDropdowns();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = null;
  }

  executeDelete(): void {
    if (!this.showDeleteConfirm) return;

    const projectId = this.showDeleteConfirm;
    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== projectId);
        this.projectService.projectsChanged.set(Date.now());
        this.showToast('Proyecto eliminado correctamente', 'success');
      },
      error: (err) => {
        console.error('Error deleting project:', err);
        this.showToast('Error al eliminar el proyecto', 'error');
      }
    });
    this.showDeleteConfirm = null;
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
      this.toastType = '';
    }, 3000);
  }

  openEditModal(project: ProjectResponse): void {
    this.editingProject = project;
    this.editProjectData = {
      name: project.name,
      description: project.description,
      key: project.key
    };
    this.showEditModal = true;
    this.closeDropdowns();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingProject = null;
  }

  saveProject(): void {
    if (!this.editingProject || !this.editProjectData.name || !this.editProjectData.key) {
      return;
    }

    this.projectService.updateProject(this.editingProject.id, this.editProjectData).subscribe({
      next: (updated) => {
        const index = this.projects.findIndex(p => p.id === updated.id);
        if (index !== -1) {
          this.projects[index] = updated;
        }
        this.closeEditModal();
        this.showToast('Proyecto actualizado correctamente', 'success');
      },
      error: (err) => {
        console.error('Error updating project:', err);
        this.showToast('Error al actualizar el proyecto', 'error');
      }
    });
  }
}