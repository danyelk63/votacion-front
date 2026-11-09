import { Categoria } from '../core/modelos';

type Severidad = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface InfoCategoria {
  id: Categoria;
  nombre: string;
  icono: string;
  severidad: Severidad;
  explica: string;
}

export const CATEGORIAS: InfoCategoria[] = [
  { id: 'VOTO', nombre: 'Voto', icono: 'pi pi-check-square', severidad: 'info', explica: 'Recepción, validación, registro, borrado y respuesta' },
  { id: 'REPLICACION', nombre: 'Replicación', icono: 'pi pi-clone', severidad: 'contrast', explica: 'El líder copia las entradas a los seguidores (anexarEntradas por RMI)' },
  { id: 'PERSISTENCIA', nombre: 'Persistencia', icono: 'pi pi-save', severidad: 'success', explica: 'Escritura en el archivo votos.txt de cada nodo' },
  { id: 'ELECCION', nombre: 'Elección', icono: 'pi pi-crown', severidad: 'warn', explica: 'Elección de líder (solicitarVoto por RMI), cambios de rol y término' },
  { id: 'RED', nombre: 'Red', icono: 'pi pi-wifi', severidad: 'secondary', explica: 'Llamadas RMI, nodos que no responden, failover' },
  { id: 'SISTEMA', nombre: 'Sistema', icono: 'pi pi-cog', severidad: 'secondary', explica: 'Arranque, RMI Registry, suscripciones, caídas simuladas' },
  { id: 'USUARIO', nombre: 'Usuario', icono: 'pi pi-user', severidad: 'secondary', explica: 'Acciones de los usuarios (ver Log del usuario)' },
];

export const INFO_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c])) as Record<string, InfoCategoria>;
