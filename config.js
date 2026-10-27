// Conexión a Supabase (ver README.md → "Configurar Supabase").
// La clave "anon" es pública por diseño: la escritura está protegida por la clave del viaje.
// Si se deja vacío, el sitio funciona en "modo local" (los check-ins quedan solo en ese teléfono).
window.TRIP_CONFIG = {
  supabaseUrl: '',        // p. ej. 'https://abcdefgh.supabase.co'
  supabaseAnonKey: '',    // Project Settings → API → anon public
};
