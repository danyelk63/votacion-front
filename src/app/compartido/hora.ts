import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(iso: string | null | undefined, conFecha = false): string {
    if (!iso) return '';
    const d = new Date(iso);
    const p = (n: number, l = 2) => String(n).padStart(l, '0');
    const hora = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
    return conFecha ? `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${hora}` : hora;
  }
}
