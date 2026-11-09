import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { EstadoNodo } from '../../core/modelos';
import { sondear } from '../../core/sondeo';
import { VotacionApi } from '../../core/votacion-api';
import { ICONO_ROL, NOMBRE_ROL, SEVERIDAD_ROL } from '../../compartido/origen';

@Component({
  selector: 'app-panel-cluster',
  imports: [ButtonModule, CardModule, ProgressBarModule, TagModule, TooltipModule],
  templateUrl: './panel-cluster.html',
  styleUrl: './panel-cluster.scss',
})
export class PanelCluster {
  private readonly api = inject(VotacionApi);
  private readonly mensajes = inject(MessageService);
  protected readonly cluster = sondear(() => this.api.cluster(), 700);
  protected readonly ocupado = signal<number | null>(null);

  protected etiqueta(n: EstadoNodo): string {
    if (n.pausado) return 'Caído (simulado)';
    if (!n.disponible) return 'Sin conexión';
    return NOMBRE_ROL[n.rol] ?? n.rol;
  }

  protected severidad(n: EstadoNodo) {
    if (n.pausado || !n.disponible) return 'danger' as const;
    return SEVERIDAD_ROL[n.rol] ?? 'secondary';
  }

  protected icono(n: EstadoNodo): string {
    if (n.pausado || !n.disponible) return 'pi pi-power-off';
    return ICONO_ROL[n.rol] ?? '';
  }

  protected progreso(n: EstadoNodo): number {
    return n.longitudLog ? Math.round(((n.indiceConfirmado ?? 0) / n.longitudLog) * 100) : 100;
  }

  protected replicacion(n: EstadoNodo): { id: string; indice: number; pct: number }[] {
    return Object.entries(n.replicacion ?? {}).map(([id, indice]) => ({
      id,
      indice,
      pct: n.longitudLog ? Math.round((indice / n.longitudLog) * 100) : 100,
    }));
  }

  protected alternar(n: EstadoNodo): void {
    this.ocupado.set(n.id);
    const accion = n.pausado ? this.api.reanudar(n.id) : this.api.pausar(n.id);
    accion.subscribe({
      next: () => {
        this.mensajes.add({
          severity: n.pausado ? 'success' : 'warn',
          summary: `Nodo ${n.id} ${n.pausado ? 'reanudado' : 'tumbado'}`,
          detail: n.pausado ? 'Vuelve a participar y se pone al día con el líder' : 'Mire cómo el resto del clúster reacciona',
          life: 3000,
        });
        this.terminar();
      },
      error: () => this.terminar(),
    });
  }

  private terminar(): void {
    this.ocupado.set(null);
    this.cluster.refrescar();
  }
}
