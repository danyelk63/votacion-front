import { Component, computed, effect, inject, input, linkedSignal, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { EventosService } from '../../core/eventos';
import { Archivos, Evento } from '../../core/modelos';
import { VotacionApi } from '../../core/votacion-api';
import { INFO_CATEGORIA } from '../../compartido/categorias';
import { HoraPipe } from '../../compartido/hora';
import { NOMBRE_ROL, Origen, SEVERIDAD_ROL } from '../../compartido/origen';

interface Fase {
  titulo: string;
  icono: string;
  descripcion: string;
  etapas: string[];
}

const FASES: Fase[] = [
  {
    titulo: 'Llega al servidor',
    icono: 'pi pi-globe',
    descripcion: 'El navegador envía la petición HTTP/JSON al gateway, que le asigna un id de traza.',
    etapas: ['RECIBIDO_HTTP'],
  },
  {
    titulo: 'Viaja por RMI',
    icono: 'pi pi-arrow-right-arrow-left',
    descripcion: 'El gateway invoca el método remoto en un nodo; si no es el líder, este la reenvía al líder por RMI.',
    etapas: ['LLAMADA_RMI', 'FAILOVER', 'RECIBIDO_RMI', 'REENVIO_LIDER', 'SIN_LIDER', 'LIDER_INACCESIBLE'],
  },
  {
    titulo: 'Se procesa en el líder',
    icono: 'pi pi-cog',
    descripcion: 'Valida los datos, verifica que la cédula no haya votado y lo agrega al log de Raft.',
    etapas: ['VALIDACION', 'VERIFICACION', 'ANEXADO_LOG', 'RECHAZADO'],
  },
  {
    titulo: 'Se replica',
    icono: 'pi pi-clone',
    descripcion: 'El líder envía la entrada a cada seguidor (anexarEntradas por RMI) y estos confirman.',
    etapas: ['ENVIO', 'ENTRADA_RECIBIDA', 'ACK'],
  },
  {
    titulo: 'Consenso por mayoría',
    icono: 'pi pi-users',
    descripcion: 'Con la mayoría de nodos la entrada queda CONFIRMADA: ya no se puede perder.',
    etapas: ['CONFIRMADO'],
  },
  {
    titulo: 'Se aplica en memoria',
    icono: 'pi pi-microchip',
    descripcion: 'Cada nodo actualiza su registro electoral en memoria, en el mismo orden.',
    etapas: ['APLICADO', 'BORRADO'],
  },
  {
    titulo: 'Se guarda en archivo',
    icono: 'pi pi-save',
    descripcion: 'Cada nodo escribe (o vacía) su archivo de texto datos/nodo-N/votos.txt.',
    etapas: ['GUARDADO_ARCHIVO', 'ARCHIVO_REINICIADO', 'ERROR_ARCHIVO'],
  },
  {
    titulo: 'Respuesta al usuario',
    icono: 'pi pi-reply',
    descripcion: 'El líder responde por RMI, el gateway responde HTTP y escribe el log del usuario.',
    etapas: ['RESPUESTA', 'RESPUESTA_HTTP', 'VOTAR', 'BORRAR_VOTOS'],
  },
];

const ETAPAS_ERROR = new Set(['RECHAZADO', 'SIN_LIDER', 'LIDER_INACCESIBLE', 'ERROR_ARCHIVO']);

interface ResumenTraza {
  traza: string;
  hora: string;
  accion: string;
  nombre: string;
  cedula: string;
  estado: string;
}

@Component({
  selector: 'app-procesamiento',
  imports: [ButtonModule, CardModule, TableModule, TabsModule, TagModule, TimelineModule, HoraPipe, Origen],
  templateUrl: './procesamiento.html',
  styleUrl: './procesamiento.scss',
})
export class Procesamiento {
  readonly traza = input<string>();

  private readonly servicio = inject(EventosService);
  private readonly api = inject(VotacionApi);
  private readonly router = inject(Router);

  protected readonly info = INFO_CATEGORIA;
  protected readonly severidadRol = SEVERIDAD_ROL;

  protected readonly trazas = computed<ResumenTraza[]>(() => {
    const mapa = new Map<string, ResumenTraza>();
    for (const e of this.servicio.eventos()) {
      if (!e.traza) continue;
      if (e.etapa === 'RECIBIDO_HTTP') {
        mapa.set(e.traza, {
          traza: e.traza,
          hora: e.hora,
          accion: e.datos['accion'] ?? 'VOTAR',
          nombre: e.datos['nombre'] ?? '',
          cedula: e.datos['cedula'] ?? '',
          estado: 'EN PROCESO',
        });
      } else if (e.categoria === 'USUARIO' && mapa.has(e.traza)) {
        mapa.get(e.traza)!.estado = e.datos['resultado'] ?? 'FINALIZADO';
      }
    }
    return [...mapa.values()].reverse();
  });

  protected readonly seleccion = linkedSignal<string | undefined>(() => this.traza() ?? this.trazas()[0]?.traza);

  protected readonly eventos = computed(() => {
    const t = this.seleccion();
    return t ? this.servicio.eventos().filter((e) => e.traza === t) : [];
  });

  protected readonly resumen = computed(() => this.trazas().find((t) => t.traza === this.seleccion()));

  private readonly inicio = computed(() => (this.eventos()[0] ? Date.parse(this.eventos()[0].hora) : 0));

  protected readonly estadoFases = computed(() =>
    FASES.map((f, i) => {
      const evs = this.eventos().filter((e) => f.etapas.includes(e.etapa ?? ''));
      const error = evs.some((e) => ETAPAS_ERROR.has(e.etapa ?? ''));
      return { numero: i + 1, fase: f, eventos: evs, estado: error ? 'error' : evs.length ? 'ok' : 'pendiente' };
    }),
  );

  protected readonly duracionTotal = computed(() => {
    const evs = this.eventos();
    return evs.length > 1 ? Date.parse(evs[evs.length - 1].hora) - Date.parse(evs[0].hora) : 0;
  });

  protected readonly porNodo = computed(() => {
    const nodos = new Map<number, { id: number; rol: string; rolId: string; recibio?: Evento; aplico?: Evento; guardo?: Evento }>();
    for (const e of this.eventos()) {
      if (e.nodoId === null) continue;
      const n = nodos.get(e.nodoId) ?? { id: e.nodoId, rol: NOMBRE_ROL[e.rol] ?? e.rol, rolId: e.rol };
      if (e.etapa === 'ANEXADO_LOG' || e.etapa === 'ENTRADA_RECIBIDA') {
        n.recibio = e;
        n.rol = NOMBRE_ROL[e.rol] ?? e.rol;
        n.rolId = e.rol;
      }
      if (e.etapa === 'APLICADO' || e.etapa === 'BORRADO') n.aplico = e;
      if (e.etapa === 'GUARDADO_ARCHIVO' || e.etapa === 'ARCHIVO_REINICIADO') n.guardo = e;
      nodos.set(e.nodoId, n);
    }
    return [...nodos.values()].sort((a, b) => a.id - b.id);
  });

  protected readonly archivos = signal<Archivos | null>(null);
  protected readonly pestana = signal<string | number | undefined>('1');
  private readonly escrituras = computed(
    () =>
      this.servicio
        .eventos()
        .filter((e) => e.etapa === 'GUARDADO_ARCHIVO' || e.etapa === 'ARCHIVO_REINICIADO' || e.etapa === 'INICIO').length,
  );

  constructor() {
    effect(() => {
      this.escrituras();
      untracked(() => this.cargarArchivos());
    });
  }

  protected cargarArchivos(): void {
    this.api.archivos().subscribe({ next: (a) => this.archivos.set(a), error: () => {} });
  }

  protected elegir(traza: string): void {
    this.seleccion.set(traza);
    this.router.navigate([], { queryParams: { traza }, replaceUrl: true });
  }

  protected desdeInicio(e: Evento): string {
    return '+' + (Date.parse(e.hora) - this.inicio()) + ' ms';
  }

  protected datos(e: Evento): [string, string][] {
    return Object.entries(e.datos ?? {});
  }

  protected resaltada(linea: string): boolean {
    const t = this.seleccion();
    return !!t && (linea.endsWith(' | ' + t) || linea.includes('traza ' + t + ')'));
  }

  protected severidadEstado(estado: string) {
    if (estado === 'ACEPTADO' || estado === 'OK') return 'success' as const;
    if (estado === 'EN PROCESO') return 'warn' as const;
    return 'danger' as const;
  }

  protected etiquetaEstado(estado: string): string {
    if (estado === 'RECHAZADO_CEDULA_DUPLICADA') return 'DUPLICADO';
    if (estado === 'RECHAZADO_DATOS_INVALIDOS') return 'INVÁLIDO';
    if (estado.startsWith('RECHAZADO')) return 'RECHAZADO';
    if (estado.startsWith('ERROR')) return 'ERROR';
    return estado;
  }

  protected titulo(t: ResumenTraza): string {
    return t.accion === 'BORRAR_VOTOS' ? 'Borrar todos los votos' : t.nombre || '(sin nombre)';
  }
}
