import { Component, inject, signal } from '@angular/core';
import { EstadoNodo } from '../core/modelos';
import { sondear } from '../core/sondeo';
import { VotacionApi } from '../core/votacion-api';

/**
 * Monitoreo del clúster en vivo: rol de cada nodo (líder / seguidor / candidato),
 * término de Raft, estado del log y replicación. Permite simular caídas.
 */
@Component({
  selector: 'app-panel-cluster',
  templateUrl: './panel-cluster.html',
  styleUrl: './panel-cluster.scss',
})
export class PanelCluster {
  private readonly api = inject(VotacionApi);
  protected readonly cluster = sondear(() => this.api.cluster(), 700);
  protected readonly ocupado = signal<number | null>(null);

  protected etiqueta(n: EstadoNodo): string {
    if (n.pausado) return 'Caído (simulado)';
    if (!n.disponible) return 'Sin conexión';
    return { LIDER: 'Líder', SEGUIDOR: 'Seguidor', CANDIDATO: 'Candidato', CAIDO: 'Sin conexión' }[n.rol];
  }

  protected clase(n: EstadoNodo): string {
    if (n.pausado || !n.disponible) return 'caido';
    return n.rol.toLowerCase();
  }

  protected replicacion(n: EstadoNodo): { id: string; indice: number }[] {
    return Object.entries(n.replicacion ?? {}).map(([id, indice]) => ({ id, indice }));
  }

  protected alternar(n: EstadoNodo): void {
    this.ocupado.set(n.id);
    const accion = n.pausado ? this.api.reanudar(n.id) : this.api.pausar(n.id);
    accion.subscribe({
      next: () => this.terminar(),
      error: () => this.terminar(),
    });
  }

  private terminar(): void {
    this.ocupado.set(null);
    this.cluster.refrescar();
  }
}
