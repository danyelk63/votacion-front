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
  mensaje: string;
  indiceLog: number;
  termino: number;
  lider: number;
  registradoEn: string;
  reenviadoPor: number | null;
  atendidoPorNodo: number;
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
}

export interface ErrorApi {
  error: string;
  codigo?: string;
  detalles?: string[];
}
