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
  ResultadoRegistro,
  Resultados,
  SolicitudVoto,
} from './modelos';

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

  vaciarTodo(): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.base}/reiniciar`, {});
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
