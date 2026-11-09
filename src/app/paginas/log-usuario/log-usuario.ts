import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventosService } from '../../core/eventos';
import { Archivos } from '../../core/modelos';
import { VotacionApi } from '../../core/votacion-api';
import { HoraPipe } from '../../compartido/hora';

/**
 * Vista 4: log (auditoría) de usuarios. Cada acción de una persona queda
 * registrada por el gateway en datos/gateway/usuarios.log y llega aquí en tiempo
 * real por WebSocket como evento de categoría USUARIO.
 */
@Component({
  selector: 'app-log-usuario',
  imports: [HoraPipe, RouterLink],
  templateUrl: './log-usuario.html',
  styleUrl: './log-usuario.scss',
})
export class LogUsuario {
  private readonly servicio = inject(EventosService);
  private readonly api = inject(VotacionApi);

  protected readonly acciones = computed(() =>
    this.servicio
      .eventos()
      .filter((e) => e.categoria === 'USUARIO')
      .slice()
      .reverse(),
  );

  protected readonly totales = computed(() => {
    const t = { aceptados: 0, rechazados: 0, operador: 0 };
    for (const a of this.acciones()) {
      if (a.etapa === 'VOTAR') {
        if (a.datos['resultado'] === 'ACEPTADO') t.aceptados++;
        else t.rechazados++;
      } else t.operador++;
    }
    return t;
  });

  protected readonly archivo = signal<Archivos['usuarios'] | null>(null);

  constructor() {
    effect(() => {
      this.acciones().length;
      untracked(() => this.cargar());
    });
  }

  protected cargar(): void {
    this.api.archivos().subscribe({ next: (a) => this.archivo.set(a.usuarios), error: () => {} });
  }

  protected clase(resultado: string | undefined): string {
    if (resultado === 'ACEPTADO' || resultado === 'OK') return 'ok';
    return 'error';
  }

  protected guion(v: string | undefined): string {
    return !v || v === '-' || v === 'null' ? '—' : v;
  }
}
