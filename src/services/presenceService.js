// src/services/presenceService.js
// Simulación de usuarios en línea en "tiempo real".
// Más adelante se puede conectar a Supabase/Firebase sin cambiar el Admin.

let intervalId = null;

/**
 * Suscribe un callback que recibirá la cantidad de usuarios en línea.
 * Devuelve una función para desuscribir.
 */
export function subscribeToPresence(onChange) {
  // Valor inicial
  let current = Math.floor(Math.random() * 4); // 0–3 usuarios al inicio
  onChange(current);

  // Cada 6 segundos simulamos cambios (como si fueran eventos en tiempo real)
  intervalId = setInterval(() => {
    const delta = Math.floor(Math.random() * 3) - 1; // -1, 0 o +1
    current = Math.max(0, current + delta);
    onChange(current);
  }, 6000);

  // Función para cancelar
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
