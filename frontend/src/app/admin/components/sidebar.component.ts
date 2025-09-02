import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-sidebar',
  imports: [CommonModule, RouterModule],
  // styles moved to global styles
  template: `
  <aside
    class="sidebar fixed left-0 top-0 z-[90] flex h-screen w-[290px] flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 dark:border-gray-800 dark:bg-black lg:static transition-transform duration-300 ease-in-out"
    [ngClass]="sidebarOpen ? 'translate-x-0 lg:translate-x-0 lg:block' : '-translate-x-full lg:hidden'"
  >
    <!-- SIDEBAR HEADER -->
    <div class="flex items-center justify-between gap-2 pt-8 sidebar-header pb-7">
      <a routerLink="/admin/dashboard" class="flex items-center gap-2">
        <span class="logo">
          <!-- Puedes reemplazar por tu logo -->
          <span class="text-lg font-semibold text-gray-900 dark:text-white">{{ appName }}</span>
        </span>
      </a>
    </div>
    <!-- SIDEBAR HEADER -->

    <div class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
      <!-- Sidebar Menu -->
      <nav>
        <!-- Menu Group -->
        <div>
          <h3 class="mb-4 text-xs uppercase leading-[20px] text-gray-400">MENU</h3>
          <ul class="flex flex-col gap-2 mb-6">
            <!-- Dashboard -->
            <li>
              <a
                routerLink="/admin/dashboard"
                routerLinkActive="menu-item-active"
                [routerLinkActiveOptions]="{ exact: true }"
                #rlaDash="routerLinkActive"
                class="menu-item group menu-item-inactive"
              >
                <svg
                  [ngClass]="rlaDash.isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="" />
                </svg>
                <span class="menu-item-text">Dashboard</span>
              </a>
            </li>

            <!-- Posts -->
            <li>
              <a
                routerLink="/admin/posts"
                routerLinkActive="menu-item-active"
                #rlaPosts="routerLinkActive"
                class="menu-item group menu-item-inactive"
              >
                <svg
                  [ngClass]="rlaPosts.isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" fill="" />
                </svg>
                <span class="menu-item-text">Posts</span>
              </a>
            </li>

            <!-- Pages -->
            <li>
              <a
                routerLink="/admin/pages"
                routerLinkActive="menu-item-active"
                #rlaPages="routerLinkActive"
                class="menu-item group menu-item-inactive"
              >
                <svg
                  [ngClass]="rlaPages.isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" fill="" />
                </svg>
                <span class="menu-item-text">Páginas</span>
              </a>
            </li>

            <!-- Menu -->
            <li>
              <a
                routerLink="/admin/menu"
                routerLinkActive="menu-item-active"
                #rlaMenu="routerLinkActive"
                class="menu-item group menu-item-inactive"
              >
                <svg
                  [ngClass]="rlaMenu.isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" />
                </svg>
                <span class="menu-item-text">Menú</span>
              </a>
            </li>

            <!-- Themes -->
            <li>
              <a
                routerLink="/admin/themes"
                routerLinkActive="menu-item-active"
                #rlaThemes="routerLinkActive"
                class="menu-item group menu-item-inactive"
              >
                <svg
                  [ngClass]="rlaThemes.isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" fill="" />
                </svg>
                <span class="menu-item-text">Temas</span>
              </a>
            </li>

            <!-- Branding -->
            <li>
              <a
                routerLink="/admin/settings/branding"
                routerLinkActive="menu-item-active"
                #rlaBranding="routerLinkActive"
                class="menu-item group menu-item-inactive"
              >
                <svg
                  [ngClass]="rlaBranding.isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 4a8 8 0 100 16 8 8 0 000-16zm1 11H8v-2h5v2zm3-4H8V9h8v2z" fill="" />
                </svg>
                <span class="menu-item-text">Branding</span>
              </a>
            </li>

            <!-- Categories -->
            <li>
              <a
                routerLink="/admin/categories"
                routerLinkActive="menu-item-active"
                #rlaCategories="routerLinkActive"
                class="menu-item group menu-item-inactive"
              >
                <svg
                  [ngClass]="rlaCategories.isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" fill="" />
                </svg>
                <span class="menu-item-text">Categorías</span>
              </a>
            </li>

            <!-- Tags -->
            <li>
              <a
                routerLink="/admin/tags"
                routerLinkActive="menu-item-active"
                #rlaTags="routerLinkActive"
                class="menu-item group menu-item-inactive"
              >
                <svg
                  [ngClass]="rlaTags.isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" fill="" />
                </svg>
                <span class="menu-item-text">Tags</span>
              </a>
            </li>
          </ul>

          <!-- Logout Button -->
          <div class="mb-10 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button (click)="logout.emit()" class="menu-item group w-full justify-start text-red-500 hover:text-red-400">
              <svg class="menu-item-icon-inactive" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="menu-item-text">Salir</span>
            </button>
          </div>
        </div>
        <!-- Menu Group -->
      </nav>
      <!-- Sidebar Menu -->
    </div>
  </aside>
  `
})
export class AdminSidebarComponent {
  @Input() appName = 'NGCMS Admin';
  @Input() sidebarOpen = false;
  @Output() logout = new EventEmitter<void>();
}
