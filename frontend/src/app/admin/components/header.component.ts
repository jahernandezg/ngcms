import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAuthService } from '../services/admin-auth.service';
import { buildAssetUrl } from '../../shared/asset-url.util';

@Component({
  standalone: true,
  selector: 'app-admin-header',
  imports: [CommonModule],
  templateUrl: './header.component.html'
})
export class AdminHeaderComponent {
  @Input() currentPageName = 'Dashboard';
  @Output() toggleSidebar = new EventEmitter<void>();

  // Estado local para UI
  @Input() sidebarOpen = false;
  menuToggle = false;
  notifyDropdownOpen = false;
  notifying = true;
  userDropdownOpen = false;

  // User info
  userName = '';
  userEmail = '';
  userAvatarUrl: string | null = null;
  get userDisplayName() { return this.userName || this.userEmail || 'Usuario'; }
  get userInitials() {
    const source = this.userName || this.userEmail || '';
    if (!source) return '?';
    // If email, take part before '@'
    const base = source.includes('@') ? source.split('@')[0] : source;
    const parts = base.trim().split(/[\s._-]+/).filter(Boolean);
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : (base.length > 1 ? base.charAt(1) : '');
    return (first + last).toUpperCase();
  }

  @ViewChild('notifyMenu') notifyMenuRef?: ElementRef<HTMLElement>;
  @ViewChild('userMenu') userMenuRef?: ElementRef<HTMLElement>;
  private auth: AdminAuthService = inject(AdminAuthService);

  constructor(){
    // Derivar datos básicos del JWT si existen
    try {
      const token = this.auth.getAccessToken();
      const hasAtob = typeof window !== 'undefined' && typeof atob !== 'undefined';
      if (token && hasAtob) {
        const payload = this.decodeJwt(token) as JwtPayload;
        this.userName = payload?.name || payload?.given_name || '';
        this.userEmail = payload?.email || '';
  const raw = (payload?.avatarUrl || payload?.picture) as string | undefined;
  this.userAvatarUrl = (buildAssetUrl(raw || null) ?? raw ?? null);
      }
    } catch { /* noop */ }
  }

  toggleDarkMode(event: Event) {
    event.preventDefault();
    const root = document.documentElement;
    root.classList.toggle('dark');
  }

  onToggleSidebarClick(){
    this.toggleSidebar.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    const notifyContains = this.notifyMenuRef?.nativeElement.contains(target) ?? false;
    const userContains = this.userMenuRef?.nativeElement.contains(target) ?? false;
    if (!notifyContains) {
      this.notifyDropdownOpen = false;
    }
    if (!userContains) {
      this.userDropdownOpen = false;
    }
  }

  onSignOut(){
    this.auth.logout();
  }

  private decodeJwt(token: string){
    const part = token.split('.')[1];
    if(!part) return {};
    const base = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base.padEnd(base.length + (4 - (base.length % 4)) % 4, '=');
    const json = atob(pad);
    return JSON.parse(json);
  }
}

type JwtPayload = {
  name?: string;
  given_name?: string;
  email?: string;
  avatarUrl?: string;
  picture?: string;
  [key: string]: unknown;
};
