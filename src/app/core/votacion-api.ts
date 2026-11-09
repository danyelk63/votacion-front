import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Archivos,
  Candidato,
  EstadoCluster,
  EstadoNodo,
  ListadoVotos,
  ResultadoBorrado,
  ResultadoRegistro,
  Resultados,
  SolicitudVoto,
} from './modelos';

/**
 * Cliente del API Gateway. El navegador no habla RMI: el gateway Java recibe
 * estas peticiones HTTP y las convierte en llamadas RMI a los nodos del clúster.
 *
 * En desarrollo "/api" va al gateway local (proxy.conf.json); en producción, a Render.
 */
@Injectable({ providedIn: 'root' })
export class VotacionApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBase;

  candidatos(): Observable<Candidato[]> {
    return this.http.get<Candidato[]>(`${this.base}/candidatos`);
  }

  votar(voto: SolicitudVoto): Observable<ResultadoRegistro> {
    return this.http.post<ResultadoRegistro>(`${this.base}/votos`, voto);
  }

  /** Borra todos los votos del clúster (la orden se replica por consenso). */
  borrarVotos(): Observable<ResultadoBorrado> {
    return this.http.delete<ResultadoBorrado>(`${this.base}/votos`);
  }

  resultados(): Observable<Resultados> {
    return this.http.get<Resultados>(`${this.base}/resultados`);
  }

  votos(): Observable<ListadoVotos> {
    return this.http.get<ListadoVotos>(`${this.base}/votos`);
  }

  cluster(): Observable<EstadoCluster> {
    return this.http.get<EstadoCluster>(`${this.base}/cluster`);
  }

  archivos(): Observable<Archivos> {
    return this.http.get<Archivos>(`${this.base}/archivos`);
  }

  pausar(id: number): Observable<EstadoNodo> {
    return this.http.post<EstadoNodo>(`${this.base}/cluster/${id}/pausar`, {});
  }

  reanudar(id: number): Observable<EstadoNodo> {
    return this.http.post<EstadoNodo>(`${this.base}/cluster/${id}/reanudar`, {});
  }
}
