import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, exhaustMap, map, merge, of, timer } from 'rxjs';

export function sondear<T>(fuente: () => Observable<T>, cadaMs: number) {
  const valor = signal<T | null>(null);
  const error = signal(false);
  const refrescar$ = new Subject<void>();

  merge(timer(0, cadaMs), refrescar$)
    .pipe(
      exhaustMap(() =>
        fuente().pipe(
          map((v) => ({ ok: true as const, v })),
          catchError(() => of({ ok: false as const })),
        ),
      ),
      takeUntilDestroyed(inject(DestroyRef)),
    )
    .subscribe((r) => {
      error.set(!r.ok);
      if (r.ok) valor.set(r.v);
    });

  return { valor: valor.asReadonly(), error: error.asReadonly(), refrescar: () => refrescar$.next() };
}
