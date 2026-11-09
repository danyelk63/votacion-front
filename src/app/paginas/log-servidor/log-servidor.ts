import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { EventosService } from '../../core/eventos';
import { Categoria, Evento } from '../../core/modelos';
import { CATEGORIAS, INFO_CATEGORIA } from '../../compartido/categorias';
import { HoraPipe } from '../../compartido/hora';
import { Origen } from '../../compartido/origen';

@Component({
  selector: 'app-log-servidor',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
    TagModule,
    ToggleButtonModule,
    TooltipModule,
    HoraPipe,
    Origen,
  ],
  templateUrl: './log-servidor.html',
  styleUrl: './log-servidor.scss',
})
export class LogServidor {
  private readonly servicio = inject(EventosService);

  protected readonly categorias = CATEGORIAS;
  protected readonly info = INFO_CATEGORIA;

  protected readonly filtroOrigen = signal<string>('todos');
  protected readonly filtroTexto = signal('');
  protected readonly categoriasActivas = signal<Categoria[]>(['VOTO', 'REPLICACION', 'PERSISTENCIA', 'ELECCION', 'RED', 'SISTEMA']);
  protected readonly congelado = signal(false);
  private readonly instantanea = signal<Evento[]>([]);

  private readonly fuente = computed(() => (this.congelado() ? this.instantanea() : this.servicio.eventos()));

  protected readonly origenes = computed(() => [
    { etiqueta: 'Todos los orígenes', valor: 'todos' },
    { etiqueta: 'Gateway', valor: 'gateway' },
    ...[...new Set(this.servicio.eventos().filter((e) => e.nodoId !== null).map((e) => e.nodoId as number))]
      .sort()
      .map((n) => ({ etiqueta: 'Nodo ' + n, valor: String(n) })),
  ]);

  protected readonly filtrados = computed(() => {
    const origen = this.filtroOrigen();
    const texto = this.filtroTexto().trim().toLowerCase();
    const cats = new Set(this.categoriasActivas());
    return this.fuente()
      .filter((e) => cats.has(e.categoria))
      .filter((e) => origen === 'todos' || (origen === 'gateway' ? e.nodoId === null : String(e.nodoId) === origen))
      .filter(
        (e) =>
          !texto ||
          e.mensaje.toLowerCase().includes(texto) ||
          (e.etapa ?? '').toLowerCase().includes(texto) ||
          (e.traza ?? '').includes(texto),
      )
      .slice(-500)
      .reverse();
  });

  protected readonly porCategoria = computed(() => {
    const conteo: Record<string, number> = {};
    for (const e of this.servicio.eventos()) conteo[e.categoria] = (conteo[e.categoria] ?? 0) + 1;
    return conteo;
  });

  protected alCongelar(valor: boolean): void {
    if (valor) this.instantanea.set(this.servicio.eventos());
    this.congelado.set(valor);
  }

  protected readonly trackSec = (_: number, e: Evento) => e.secuencia;

  protected datos(e: Evento): [string, string][] {
    return Object.entries(e.datos ?? {});
  }
}
