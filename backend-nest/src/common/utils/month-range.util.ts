export function buildMonthRange(
  mes?: number,
  anio?: number,
): [string | null, string | null] {
  if (mes && anio) {
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const inicio = `${anio}-${pad(mes)}-01 00:00:00`;
    const fin = `${anio}-${pad(mes)}-${pad(ultimoDia)} 23:59:59`;
    return [inicio, fin];
  }
  return [null, null];
}
