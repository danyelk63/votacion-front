import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { EventosService } from '../../core/eventos';
import { Archivos } from '../../core/modelos';
import { VotacionApi } from '../../core/votacion-api';
import { HoraPipe } from '../../compartido/hora';

interface FilaUsuario {
  secuencia: number;
  hora: string;
  accion: string;
  resultado: string;
  nombre: string;
  cedula: string;
  candidato: string;
  ip: string;
  navegador: string;
  nodo: string;
  detalle: string;
  traza: string | null;
}

/**
 * Vista: log (auditoría) de usuarios. El gateway registra cada acción en
 * datos/gateway/usuarios.log y la publica como evento USUARIO por WebSocket.
 */
@Component({
  selector: 'app-log-usuario',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PanelModule,
    TableModule,
    TagModule,
    HoraPipe,
  ],
  templateUrl: './log-usuario.html',
  styleUrl: './log-usuario.scss',
})
export class LogUsuario {
  private readonly servicio = inject(EventosService);
  private readonly api = inject(VotacionApi);

  protected readonly filas = computed<FilaUsuario[]>(() =>
    this.servicio
      .eventos()
      .filter((e) => e.categoria === 'USUARIO')
      .map((e) => ({
        secuencia: e.secuencia,
        hora: e.hora,
        accion: e.etapa ?? '',
        resultado: e.datos['resultado'] ?? '',
        nombre: limpio(e.datos['nombre']),
        cedula: limpio(e.datos['cedula']),
        candidato: limpio(e.datos['candidato']),
        ip: limpio(e.datos['ip']),
        navegador: limpio(e.datos['navegador']),
        nodo: limpio(e.datos['nodoAtendio']),
        detalle: limpio(e.datos['detalle']),
        traza: e.traza,
      }))
      .reverse(),
  );

  protected readonly totales = computed(() => {
    const t = { aceptados: 0, rechazados: 0, borrados: 0, operador: 0 };
    for (const f of this.filas()) {
      if (f.accion === 'VOTAR') {
        if (f.resultado === 'ACEPTADO') t.aceptados++;
        else t.rechazados++;
      } else if (f.accion === 'BORRAR_VOTOS') t.borrados++;
      else t.operador++;
    }
    return t;
  });

  protected readonly archivo = signal<Archivos['usuarios'] | null>(null);

  constructor() {
    effect(() => {
      this.filas().length;
      untracked(() => this.cargar());
    });
  }

  protected cargar(): void {
    this.api.archivos().subscribe({ next: (a) => this.archivo.set(a.usuarios), error: () => {} });
  }

  protected severidad(resultado: string) {
    return resultado === 'ACEPTADO' || resultado === 'OK' ? ('success' as const) : ('danger' as const);
  }

  protected iconoAccion(accion: string): string {
    return (
      { VOTAR: 'pi pi-check-square', BORRAR_VOTOS: 'pi pi-trash', TUMBAR_NODO: 'pi pi-power-off', REANUDAR_NODO: 'pi pi-play' }[
        accion
      ] ?? 'pi pi-user'
    );
  }
}

function limpio(v: string | undefined): string {
  return !v || v === '-' || v === 'null' ? '' : v;
}
