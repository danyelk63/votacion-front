import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventosService } from '../../core/eventos';
import { Categoria, Evento } from '../../core/modelos';
import { HoraPipe } from '../../compartido/hora';
import { Origen } from '../../compartido/origen';

interface DescripcionCategoria {
  id: Categoria;
  nombre: string;
  explica: string;
}

/**
 * Vista 2: log del servidor en tiempo real. Muestra TODO lo que hacen el gateway
 * y cada nodo (con su tipo: líder / seguidor / candidato), tal como llega por WebSocket.
 */
@Component({
  selector: 'app-log-servidor',
  imports: [HoraPipe, Origen, RouterLink],
  templateUrl: './log-servidor.html',
  styleUrl: './log-servidor.scss',
})
export class LogServidor {
  private readonly servicio = inject(EventosService);

  protected readonly categorias: DescripcionCategoria[] = [
    { id: 'VOTO', nombre: 'Voto', explica: 'Recepción, validación, registro y respuesta de un voto' },
    { id: 'REPLICACION', nombre: 'Replicación', explica: 'El líder copia el voto a los seguidores (anexarEntradas por RMI)' },
    { id: 'PERSISTENCIA', nombre: 'Persistencia', explica: 'Escritura del voto en el archivo votos.txt de cada nodo' },
    { id: 'ELECCION', nombre: 'Elección', explica: 'Elección de líder (solicitarVoto por RMI), cambios de rol y término' },
    { id: 'RED', nombre: 'Red', explica: 'Llamadas RMI, nodos que dejan de responder, failover' },
    { id: 'SISTEMA', nombre: 'Sistema', explica: 'Arranque, publicación en el RMI Registry, suscripciones, caídas simuladas' },
    { id: 'USUARIO', nombre: 'Usuario', explica: 'Acciones de los usuarios (ver vista 4)' },
  ];

  protected readonly filtroNodo = signal<string>('todos');
  protected readonly filtroTexto = signal('');
  protected readonly categoriasActivas = signal<Set<Categoria>>(
    new Set(['VOTO', 'REPLICACION', 'PERSISTENCIA', 'ELECCION', 'RED', 'SISTEMA']),
  );
  protected readonly pausado = signal(false);
  private readonly congelados = signal<Evento[]>([]);
  protected readonly expandido = signal<number | null>(null);

  private readonly fuente = computed(() => (this.pausado() ? this.congelados() : this.servicio.eventos()));

  protected readonly filtrados = computed(() => {
    const nodo = this.filtroNodo();
    const texto = this.filtroTexto().trim().toLowerCase();
    const cats = this.categoriasActivas();
    return this.fuente()
      .filter((e) => cats.has(e.categoria))
      .filter((e) => nodo === 'todos' || (nodo === 'gateway' ? e.nodoId === null : String(e.nodoId) === nodo))
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

  protected readonly nodosConocidos = computed(() =>
    [...new Set(this.servicio.eventos().filter((e) => e.nodoId !== null).map((e) => e.nodoId as number))].sort(),
  );

  protected readonly porCategoria = computed(() => {
    const conteo: Record<string, number> = {};
    for (const e of this.servicio.eventos()) conteo[e.categoria] = (conteo[e.categoria] ?? 0) + 1;
    return conteo;
  });

  protected alternarCategoria(c: Categoria): void {
    this.categoriasActivas.update((s) => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });
  }

  protected alternarPausa(): void {
    if (!this.pausado()) this.congelados.set(this.servicio.eventos());
    this.pausado.update((p) => !p);
  }

  protected alternarDetalle(s: number): void {
    this.expandido.update((x) => (x === s ? null : s));
  }

  protected datos(e: Evento): [string, string][] {
    return Object.entries(e.datos ?? {});
  }

  protected texto(ev: Event): string {
    return (ev.target as HTMLInputElement).value;
  }
}
