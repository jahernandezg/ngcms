import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse } from '@cms-workspace/shared-types';
import { faBlog, faBullhorn, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';

interface Overview { posts: number; published: number; users: number; recent: { id: string; title: string; status: string; createdAt: string; }[] }

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FontAwesomeModule, RouterModule ],
  // styles moved to global styles
  templateUrl: './dashboard.component.html',

})
export class DashboardComponent {
  private http = inject(HttpClient);
  overview = signal<Overview | null>(null);

  faBlog = faBlog;
  faBullhorn = faBullhorn;
  faUsers = faUsers;
  constructor() {
    this.http.get<ApiResponse<Overview>>('/api/admin/dashboard/overview').subscribe(r => {
      if (r?.success) this.overview.set(r.data);
    });
  }
}
