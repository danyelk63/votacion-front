import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Archivos,
  Candidato,
  EstadoCluster,
  EstadoNodo,
  ListadoVotos,
  ResultadoRegistro,
  Resultados,
  SolicitudVoto,
} from './modelos';

/**
 * Cliente del API Gateway. El navegador no habla RMI: el gateway Java recibe
 * estas peticiones HTTP y las convierte en llamadas RMI a los nodos del clúster.
 *
 * En desarrollo, "/api" se redirige a http://localhost:8080 con proxy.conf.json.
 */
@Injectable({ providedIn: 'root' })
export class VotacionApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  candidatos(): Observable<Candidato[]> {
    return this.http.get<Candidato[]>(`${this.base}/candidatos`);
  }

  votar(voto: SolicitudVoto): Observable<ResultadoRegistro> {
    return this.http.post<ResultadoRegistro>(`${this.base}/votos`, voto);
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
