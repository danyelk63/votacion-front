// Tipos que devuelve el gateway REST (ver votacion-back/README.md).

export interface Candidato {
  id: string;
  nombre: string;
  partido: string;
}

export interface SolicitudVoto {
  nombre: string;
  cedula: string;
  candidato: string;
}

export interface ResultadoRegistro {
  traza: string;
  duracionMs: number;
  mensaje: string;
  indiceLog: number;
  termino: number;
  lider: number;
  registradoEn: string;
  reenviadoPor: number | null;
  atendidoPorNodo: number;
}

export interface ResultadoBorrado {
  mensaje: string;
  votosBorrados: number;
  indiceLog: number;
  termino: number;
  lider: number;
  traza: string;
  duracionMs: number;
}

export interface ResultadoCandidato extends Candidato {
  votos: number;
  porcentaje: number;
}

export interface Resultados {
  total: number;
  candidatos: ResultadoCandidato[];
  servidoPorNodo: number;
  consistente: boolean;
  atendidoPorNodo: number;
}

export interface VotoPublico {
  nombre: string;
  cedula: string;
  candidato: string;
  registradoEn: string;
  recibidoPorNodo: number;
  indiceLog: number;
}

export interface ListadoVotos {
  votos: VotoPublico[];
  servidoPorNodo: number;
  consistente: boolean;
}

export type Rol = 'LIDER' | 'SEGUIDOR' | 'CANDIDATO' | 'CAIDO';


export interface EstadoNodo {
  id: number;
  direccion: string;
  disponible: boolean;
  rol: Rol;
  termino?: number;
  liderId?: number | null;
  votoPara?: number | null;
  pausado: boolean;
  longitudLog?: number;
  indiceConfirmado?: number;
  ultimoAplicado?: number;
  totalVotos?: number;
  replicacion?: Record<string, number> | null;
}

export interface EstadoCluster {
  liderActual: number | null;
  nodos: EstadoNodo[];
  clientesWebSocket?: number;
}

export interface ErrorApi {
  error: string;
  codigo?: string;
  detalles?: string[];
}

// ------------------------------------------------------------------ trazabilidad

export type RolEvento = 'LIDER' | 'SEGUIDOR' | 'CANDIDATO' | 'GATEWAY';
export type Categoria = 'SISTEMA' | 'ELECCION' | 'VOTO' | 'REPLICACION' | 'PERSISTENCIA' | 'RED' | 'USUARIO';

/** Evento que llega por WebSocket (generado por un nodo o por el gateway). */
export interface Evento {
  secuencia: number;
  hora: string;
  fuente: 'NODO' | 'GATEWAY';
  nodoId: number | null;
  rol: RolEvento;
  termino: number | null;
  categoria: Categoria;
  etapa: string | null;
  traza: string | null;
  mensaje: string;
  datos: Record<string, string>;
}

export type MensajeWs =
  | { tipo: 'historial'; eventos: Evento[] }
  | { tipo: 'evento'; evento: Evento }
  | { tipo: 'reinicio' };

export interface ArchivoNodo {
  nodoId: number;
  disponible: boolean;
  ruta?: string;
  totalLineas?: number;
  lineas?: string[];
}

export interface Archivos {
  nodos: ArchivoNodo[];
  usuarios: { ruta: string; totalLineas: number; lineas: string[] };
}
