import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition, faCircleCheck, faCircleInfo, faTriangleExclamation, faCircleXmark, faXmark } from '@fortawesome/free-solid-svg-icons';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'app-admin-alert',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './alert.component.html'
})
export class AlertComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() title = '';
  @Input() message = '';
  @Input() linkText?: string;
  @Input() linkHref?: string;
  @Input() icon?: IconDefinition;
  @Input() dismissible = true;
  @Output() closed = new EventEmitter<void>();

  // Defaults based on variant
  defaultIcon = computed<IconDefinition>(() => {
    switch (this.variant) {
      case 'success': return faCircleCheck;
      case 'warning': return faTriangleExclamation;
      case 'error': return faCircleXmark;
  case 'neutral': return faCircleInfo;
      default: return faCircleInfo;
    }
  });

  // Styling maps inspired by TailAdmin alerts
  containerClasses = computed(() => {
    switch (this.variant) {
      case 'success':
        return 'relative rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-700/40 dark:bg-green-500/10 dark:text-green-300';
      case 'warning':
        return 'relative rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800 dark:border-yellow-700/40 dark:bg-yellow-500/10 dark:text-yellow-300';
      case 'error':
        return 'relative rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-700/40 dark:bg-red-500/10 dark:text-red-300';
      case 'neutral':
        return 'relative rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 dark:border-gray-700/40 dark:bg-gray-500/10 dark:text-gray-300';
      case 'info':
      default:
        return 'relative rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 dark:border-blue-700/40 dark:bg-blue-500/10 dark:text-blue-300';
    }
  });

  iconWrapClasses = computed(() => {
    switch (this.variant) {
      case 'success': return 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400';
      case 'warning': return 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400';
      case 'error': return 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400';
  case 'neutral': return 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400';
      case 'info':
      default: return 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400';
    }
  });

  titleClasses = computed(() => 'text-sm font-semibold');
  messageClasses = computed(() => 'text-sm');
  linkClasses = computed(() => 'text-sm font-medium underline decoration-from-font underline-offset-2');

  // close icon
  xIcon: IconDefinition = faXmark;
}
