export function explainLocalGenerationError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const normalized = raw.toLocaleLowerCase('es');

  if (/no available backend|gpu adapter|webgpu.*(?:unavailable|failed|error)/i.test(normalized)) {
    return 'El navegador detecta WebGPU, pero no pudo obtener un adaptador WebGPU utilizable. Comprueba que Chrome esté actualizado, que la aceleración gráfica esté activa y que el controlador de video esté al día. También puedes probar otro equipo compatible.';
  }
  if (/out of memory|memory allocation|failed to allocate|insufficient memory/i.test(normalized)) {
    return 'No hay memoria suficiente para preparar el modelo local. Cierra otras pestañas, reinicia el navegador o prueba un equipo con más memoria disponible.';
  }
  if (/failed to fetch|network|load failed|fetch.*failed|download/i.test(normalized)) {
    return 'No se pudo completar la descarga del modelo. Revisa la conexión, vuelve a intentarlo y confirma que Hugging Face no esté bloqueado en tu red.';
  }

  const firstLine = raw.split('\n')[0]?.trim();
  return firstLine || 'La generación local no pudo completarse. Vuelve a intentarlo o prueba otro dispositivo.';
}
