import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private sidebarCollapsedSignal = signal<boolean>(false);
  
  public isSidebarCollapsed = this.sidebarCollapsedSignal.asReadonly();

  toggleSidebar() {
    this.sidebarCollapsedSignal.update(val => !val);
  }

  setSidebarCollapsed(val: boolean) {
    this.sidebarCollapsedSignal.set(val);
  }
}
