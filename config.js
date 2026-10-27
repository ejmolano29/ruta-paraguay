// Conexión a Supabase (ver README.md → "Configurar Supabase").
// La clave "anon" es pública por diseño: la escritura está protegida por la clave del viaje.
// Si se deja vacío, el sitio funciona en "modo local" (los check-ins quedan solo en ese teléfono).
window.TRIP_CONFIG = {
  supabaseUrl: 'https://vwwchisyiuootmudglbg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3d2NoaXN5aXVvb3RtdWRnbGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMTUyNDksImV4cCI6MjEwODY5MTI0OX0.RKec134C81a3vzwSWSn3nhyPJI6oV-nbgPJBUWoxL9E',
};
