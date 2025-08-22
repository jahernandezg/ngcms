import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
// (Drag & Drop temporalmente removido para simplificar; se puede reintroducir luego)

interface MenuItemEntity { id: string; title: string; type: string; sortOrder: number; parentId?: string|null; url?: string|null; isVisible?: boolean; openNewWindow?: boolean; targetId?: string|null }
interface Envelope<T> { success: boolean; message?: string; data: T }
interface SimpleRef { id: string; title: string; slug?: string }

@Component({
  standalone: true,
  selector: 'app-menu-list',
  imports: [CommonModule, FormsModule, DragDropModule],
  styles: [`
  /* Referencia requerida por Tailwind CSS v4 para permitir @apply en estilos aislados */
  @reference "tailwindcss";
    .menu-box { @apply border rounded p-3 bg-white/60 backdrop-blur; }
    .drag-item { @apply flex items-center justify-between gap-2 px-2 py-1 bg-white border rounded shadow-sm cursor-move; }
    .drag-item[data-nested='true'] { @apply bg-indigo-50; }
  `],
  template: `
  <div class="flex items-center justify-between mb-4 flex-wrap gap-4">
    <h1 class="text-2xl font-semibold">Menú</h1>
    <div class="flex gap-2 text-sm">
      <button (click)="addRoot()" class="px-3 py-1.5 border rounded">Añadir Ítem</button>
      <button (click)="saveOrder()" class="px-3 py-1.5 bg-blue-600 text-white rounded" [disabled]="savingOrder()">Guardar Orden</button>
    </div>
  </div>
  <p *ngIf="loading()" class="text-sm text-gray-500">Cargando...</p>
  <div *ngIf="!loading()" class="space-y-6">
    <div class="menu-box">
      <h2 class="font-semibold mb-2 text-sm">Raíz</h2>
      <div class="space-y-2" cdkDropList (cdkDropListDropped)="dropRoot($event)">
        <div *ngFor="let item of roots(); let i = index" class="drag-item" cdkDrag>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">{{item.title}}</div>
            <div class="text-xs text-gray-500">{{item.type}} <span *ngIf="item.url">→ {{item.url}}</span></div>
          </div>
          <div class="flex gap-1">
            <button class="text-xs px-2 py-0.5 border rounded" (click)="addChild(item)">Sub</button>
            <button class="text-xs px-2 py-0.5 border rounded" (click)="edit(item)">Editar</button>
            <button class="text-xs px-2 py-0.5 border rounded text-red-600" (click)="remove(item)" [disabled]="actioning()">X</button>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="childrenMapKeys().length" class="space-y-4">
      <div *ngFor="let pid of childrenMapKeys()" class="menu-box">
        <h3 class="font-semibold mb-2 text-sm">Hijos de {{ labelFor(pid) }}</h3>
        <div class="space-y-2" cdkDropList (cdkDropListDropped)="dropChild($event, pid)">
          <div *ngFor="let item of childrenMap()[pid]; let j = index" class="drag-item" data-nested="true" cdkDrag>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm">{{item.title}}</div>
              <div class="text-xs text-gray-500">{{item.type}} <span *ngIf="item.url">→ {{item.url}}</span></div>
            </div>
            <div class="flex gap-1">
              <button class="text-xs px-2 py-0.5 border rounded" (click)="edit(item)">Editar</button>
              <button class="text-xs px-2 py-0.5 border rounded text-red-600" (click)="remove(item)" [disabled]="actioning()">X</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div *ngIf="editing()" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded shadow-lg w-full max-w-md p-6 space-y-4">
      <h2 class="text-lg font-semibold">{{ editing()!.id ? 'Editar Ítem' : 'Nuevo Ítem' }}</h2>
      <form #f="ngForm" class="space-y-3" (ngSubmit)="saveItem()">
        <div>
          <label class="block text-xs font-medium mb-1" for="miTitle">Título</label>
          <input id="miTitle" [(ngModel)]="editing()!.title" name="title" required class="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1" for="miType">Tipo</label>
          <select id="miType" [(ngModel)]="editing()!.type" name="type" required class="w-full border rounded px-2 py-1 text-sm" (change)="onTypeChange()">
            <option value="PAGE">PAGE</option>
            <option value="POST">POST</option>
            <option value="BLOG_INDEX">BLOG_INDEX</option>
            <option value="CATEGORY">CATEGORY</option>
            <option value="EXTERNAL_LINK">EXTERNAL_LINK</option>
          </select>
        </div>
        <div *ngIf="editing()!.type==='EXTERNAL_LINK'">
          <label class="block text-xs font-medium mb-1" for="miUrl">URL</label>
          <input id="miUrl" [(ngModel)]="editing()!.url" name="url" type="url" class="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div class="flex items-center gap-2">
          <input id="miVisible" type="checkbox" [(ngModel)]="editing()!.isVisible" name="isVisible" />
          <label class="text-xs" for="miVisible">Visible</label>
          <input id="miNewWindow" type="checkbox" [(ngModel)]="editing()!.openNewWindow" name="openNewWindow" />
          <label class="text-xs" for="miNewWindow">Nueva Ventana</label>
        </div>
        <div *ngIf="showTargetSelector()" class="pt-1">
          <label class="block text-xs font-medium mb-1" for="miTarget">Destino</label>
          <select id="miTarget" [(ngModel)]="editing()!.targetId" name="targetId" class="w-full border rounded px-2 py-1 text-xs">
            <option value="">-- seleccionar --</option>
            <ng-container *ngIf="editing()!.type==='PAGE'">
              <option *ngFor="let p of pagesRef()" [value]="p.id">Página: {{p.title}}</option>
            </ng-container>
            <ng-container *ngIf="editing()!.type==='CATEGORY'">
              <option *ngFor="let c of catsRef()" [value]="c.id">Categoría: {{c.title}}</option>
            </ng-container>
            <ng-container *ngIf="editing()!.type==='POST'">
              <option *ngFor="let po of postsRef()" [value]="po.id">Post: {{po.title}}</option>
            </ng-container>
          </select>
          <p *ngIf="loadingRefs()" class="text-[10px] text-gray-500 mt-1">Cargando opciones…</p>
        </div>
        <div class="flex gap-2 pt-2">
          <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm" [disabled]="savingItem()">Guardar</button>
          <button type="button" class="px-3 py-1.5 border rounded text-sm" (click)="cancelEdit()">Cancelar</button>
        </div>
      </form>
    </div>
  </div>
  <p *ngIf="error()" class="text-sm text-red-600 mt-4">{{error()}}</p>
  `
})
export class MenuListComponent {
  private http = inject(HttpClient);
  loading = signal(false);
  actioning = signal(false);
  savingOrder = signal(false);
  savingItem = signal(false);
  items = signal<MenuItemEntity[]>([]);
  editing = signal<MenuItemEntity | null>(null);
  error = signal<string|null>(null);
  pagesRef = signal<SimpleRef[]>([]);
  catsRef = signal<SimpleRef[]>([]);
  postsRef = signal<SimpleRef[]>([]);
  loadingRefs = signal(false);

  constructor(){ this.load(); }

  get roots(){ return () => this.items().filter(i => !i.parentId).sort((a,b)=>a.sortOrder-b.sortOrder); }
  get childrenMap(){ return () => this.items().filter(i=>!!i.parentId).reduce<Record<string,MenuItemEntity[]>>((acc,it)=>{ const pid = it.parentId as string; (acc[pid]=acc[pid]||[]).push(it); return acc; },{}); }
  childrenMapKeys(){ return Object.keys(this.childrenMap()).sort(); }
  labelFor(id: string){ const it = this.items().find(i=>i.id===id); return it? it.title : id; }

  private unwrap<T>(v: unknown): T {
    if (v && typeof v === 'object' && 'success' in v && 'data' in (v as Record<string, unknown>)) {
      return (v as Envelope<T>).data;
    }
    return v as T;
  }

  load(){
    this.loading.set(true);
    this.http.get<Envelope<MenuItemEntity[]> | MenuItemEntity[]>(`/api/admin/menu`).subscribe({
      next: res => { const arr = this.unwrap<MenuItemEntity[]>(res) || []; this.items.set(Array.isArray(arr)? arr: []); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Error cargando menú'); }
    });
    this.loadRefs();
  }

  loadRefs(){
    this.loadingRefs.set(true);
  interface PageRefDto { id: string; title: string; slug: string }
  interface CatRefDto { id: string; name: string; slug: string }
  interface PostRefDto { id: string; title: string; slug: string }
  const pages$ = this.http.get<Envelope<{items: PageRefDto[]}> | {items: PageRefDto[]}>(`/api/admin/pages?status=PUBLISHED&limit=100`);
  // Nota: categorías viven bajo admin/taxonomy
  const cats$ = this.http.get<Envelope<CatRefDto[]> | CatRefDto[]>(`/api/admin/taxonomy/categories`);
  // Posts: la API de admin/posts devuelve { items, total, page, limit } (probablemente envuelto)
  type PostsListShape = { items: PostRefDto[]; total?: number; page?: number; limit?: number };
  const posts$ = this.http.get<unknown>(`/api/admin/posts?status=PUBLISHED&limit=100`);
  pages$.subscribe({ next: r => { const val = this.unwrap<{items: PageRefDto[]}>(r); this.pagesRef.set((val?.items||[]).map(p=>({id:p.id,title:p.title,slug:p.slug}))); }, error: () => {/* ignora */} });
  cats$.subscribe({ next: r => { const arr = this.unwrap<CatRefDto[]>(r) || []; this.catsRef.set(arr.map(c=>({id:c.id,title:c.name,slug:c.slug}))); }, error: () => { this.catsRef.set([]); } });
  posts$.subscribe({
    next: r => {
      // Formas posibles:
      // 1) { success, data: { items: [...] } }
      // 2) { success, data: [...] , meta: {...} }
      // 3) { items: [...] }
      // 4) [ ... ]
      let payload = r;
      if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
        payload = (payload as Envelope<unknown>).data as unknown;
      }
      let list: PostRefDto[] = [];
      if (Array.isArray(payload)) list = payload as PostRefDto[];
      else if (payload && typeof payload === 'object' && 'items' in (payload as Record<string, unknown>) && Array.isArray((payload as PostsListShape).items)) {
        list = (payload as PostsListShape).items;
      }
      this.postsRef.set(list.map(p => ({ id: p.id, title: (p.title || p.slug), slug: p.slug })));
      this.loadingRefs.set(false);
    },
    error: () => { this.loadingRefs.set(false); }
  });
  }

  addRoot(){ this.editing.set({ id: '', title: '', type: 'PAGE', sortOrder: this.roots().length, isVisible: true }); }
  addChild(parent: MenuItemEntity){ this.editing.set({ id:'', title:'', type:'PAGE', sortOrder: (this.childrenMap()[parent.id]?.length||0), parentId: parent.id, isVisible: true }); }
  edit(item: MenuItemEntity){ this.editing.set({ ...item }); }
  cancelEdit(){ this.editing.set(null); }

  onTypeChange(){ const e = this.editing(); if(!e) return; if(e.type !== 'EXTERNAL_LINK') e.url = undefined; if(!this.showTargetSelector()) e.targetId = undefined; }
  showTargetSelector(){ const e = this.editing(); if(!e) return false; return ['PAGE','CATEGORY','POST'].includes(e.type); }

  saveItem(){
    const e = this.editing(); if(!e || !e.title) return;
    this.savingItem.set(true);
  const payload: Partial<MenuItemEntity> & { title: string; type: string } = { title: e.title, type: e.type, url: e.url, parentId: e.parentId, isVisible: e.isVisible, openNewWindow: e.openNewWindow, targetId: e.targetId };
    // Convertir IDs a slugs para tipos internos (guardamos slug para URLs públicas limpias)
    if (payload.targetId && ['PAGE','CATEGORY','POST'].includes(payload.type)) {
      if (payload.type === 'PAGE') {
        const ref = this.pagesRef().find(p => p.id === payload.targetId);
        if (ref) payload.targetId = ref.slug; }
      if (payload.type === 'CATEGORY') {
        const ref = this.catsRef().find(c => c.id === payload.targetId);
        if (ref) payload.targetId = ref.slug; }
      if (payload.type === 'POST') {
        const ref = this.postsRef().find(po => po.id === payload.targetId);
        if (ref) payload.targetId = ref.slug; }
    }
    let req;
    if(!e.id){ payload.sortOrder = e.sortOrder; req = this.http.post<Envelope<MenuItemEntity>|MenuItemEntity>(`/api/admin/menu/items`, payload); }
    else req = this.http.put<Envelope<MenuItemEntity>|MenuItemEntity>(`/api/admin/menu/items/${e.id}`, payload);
    req.subscribe({
      next: savedResp => { const saved = this.unwrap<MenuItemEntity>(savedResp); if(!e.id) { this.items.update(arr => [...arr, saved]); } else { this.items.update(arr => arr.map(i=> i.id===saved.id? saved : i)); }
        this.editing.set(null); this.savingItem.set(false); },
      error: () => { this.error.set('Error guardando'); this.savingItem.set(false); }
    });
  }

  remove(item: MenuItemEntity){
    if(!confirm('¿Eliminar ítem?')) return;
    this.actioning.set(true);
  this.http.delete(`/api/admin/menu/items/${item.id}`).subscribe({
      next: () => { this.items.update(arr => arr.filter(i=> i.id!==item.id && i.parentId!==item.id)); this.actioning.set(false); },
      error: () => { this.actioning.set(false); this.error.set('Error eliminando'); }
    });
  }

  dropRoot(event: CdkDragDrop<MenuItemEntity[]>) {
    const roots = this.roots();
    moveItemInArray(roots, event.previousIndex, event.currentIndex);
    roots.forEach((it,i)=> it.sortOrder = i);
    const children = this.items().filter(i=>i.parentId);
    this.items.set([...roots, ...children]);
  }

  dropChild(event: CdkDragDrop<MenuItemEntity[]>, parentId: string) {
    const map = this.childrenMap();
    const list = map[parentId];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    list.forEach((it,i)=> it.sortOrder = i);
    const roots = this.roots();
    const otherChildren = Object.entries(map).filter(([k])=>k!==parentId).flatMap(([,v])=>v);
    this.items.set([...roots, ...list, ...otherChildren]);
  }

  saveOrder(){
    this.savingOrder.set(true);
    const order = this.items().map(i => ({ id: i.id, sortOrder: i.sortOrder, parentId: i.parentId || null }));
    this.http.put(`/api/admin/menu/reorder`, { order }).subscribe({
      next: () => { this.savingOrder.set(false); },
      error: () => { this.savingOrder.set(false); this.error.set('Error guardando orden'); }
    });
  }
}
