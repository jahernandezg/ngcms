import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaxonomyService } from './taxonomy.service';
import { ToastService } from '../components/toast-container.component';

@Component({
  selector: 'app-tag-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-100">Tags</h2>
    <button class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-60 transition-colors" (click)="openCreate()">Nuevo</button>
  </div>

  <div *ngIf="svc.loadingTags()" class="text-sm text-neutral-500 dark:text-neutral-400">Cargando...</div>
  <table class="w-full border border-neutral-200 dark:border-neutral-700 text-sm rounded overflow-hidden" *ngIf="!svc.loadingTags() && tags().length">
    <thead>
      <tr class="bg-gray-100 dark:bg-neutral-800 text-left text-neutral-700 dark:text-neutral-300">
        <th class="p-2">Nombre</th>
        <th class="p-2">Slug</th>
        <th class="p-2 w-40">Acciones</th>
      </tr>
    </thead>
    <tbody class="bg-white dark:bg-neutral-900/40">
      <tr *ngFor="let t of tags()" class="border-t border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 transition-colors">
        <td class="p-2 text-neutral-800 dark:text-neutral-200">{{t.name}}</td>
        <td class="p-2 text-neutral-500 dark:text-neutral-400">{{t.slug}}</td>
        <td class="p-2 space-x-2">
          <button class="px-2 py-0.5 text-xs bg-yellow-500 hover:bg-yellow-400 text-white rounded transition-colors" (click)="startEdit(t.id)">Editar</button>
          <button class="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded disabled:opacity-60 transition-colors" (click)="remove(t.id)" [disabled]="busy()">Borrar</button>
        </td>
      </tr>
    </tbody>
  </table>
  <div *ngIf="!svc.loadingTags() && !tags().length" class="text-sm text-neutral-500 dark:text-neutral-400">Sin tags.</div>

  <div *ngIf="formVisible()" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 rounded shadow w-full max-w-md text-neutral-800 dark:text-neutral-100">
      <h3 class="font-semibold mb-3" *ngIf="!editingId()">Crear tag</h3>
      <h3 class="font-semibold mb-3" *ngIf="editingId()">Editar tag</h3>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3">
        <div>
          <label for="tag-name" class="block text-sm mb-1 text-neutral-700 dark:text-neutral-300">Nombre</label>
          <input id="tag-name" type="text" formControlName="name" class="border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded w-full px-2 py-1 transition-colors" />
        </div>
        <div class="flex justify-end space-x-2 pt-2">
          <button type="button" class="px-3 py-1 rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors" (click)="close()">Cancelar</button>
          <button type="submit" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-60 transition-colors" [disabled]="form.invalid || busy()">Guardar</button>
        </div>
      </form>
    </div>
  </div>
  `
})
export class TagListComponent implements OnInit {
  svc = inject(TaxonomyService);
  toast = inject(ToastService);
  fb = inject(FormBuilder);

  tags = this.svc.tags;
  formVisible = signal(false);
  editingId = signal<string | null>(null);
  busy = signal(false);

  form = this.fb.group({ name: ['', [Validators.required, Validators.minLength(2)]] });

  ngOnInit() { this.svc.loadTags(); }

  openCreate(){
    this.form.reset();
    this.editingId.set(null);
    this.formVisible.set(true);
  }
  startEdit(id: string){
    const tag = this.tags().find(t => t.id===id);
    if(!tag) return;
    this.editingId.set(id);
    this.form.patchValue({ name: tag.name });
    this.formVisible.set(true);
  }
  close(){
    if(this.busy()) return;
    this.formVisible.set(false);
  }
  submit(){
    if(this.form.invalid) return;
    this.busy.set(true);
    const name = this.form.value.name as string | undefined;
    if(!name){ this.busy.set(false); return; }
    const editing = this.editingId();
    const obs = editing ? this.svc.updateTag(editing, { name }) : this.svc.createTag({ name });
    obs.subscribe({
      next: () => {
        this.svc.loadTags();
        this.busy.set(false);
        this.formVisible.set(false);
        this.toast.success(this.editingId() ? 'Tag actualizado' : 'Tag creado');
      },
      error: err => {
        console.error(err);
        const msg = (err?.error?.message || '').toString();
        if (/slug|unique/i.test(msg)) this.toast.error('Nombre duplicado'); else this.toast.error('Error guardando');
        this.busy.set(false);
      }
    });
  }
  remove(id: string){
    if(!confirm('¿Eliminar tag?')) return;
    this.busy.set(true);
    this.svc.deleteTag(id).subscribe({
      next: () => { this.svc.loadTags(); this.busy.set(false); this.toast.success('Tag eliminado'); },
      error: err => { console.error(err); this.toast.error('Error eliminando'); this.busy.set(false); }
    });
  }
}
