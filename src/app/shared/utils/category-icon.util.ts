/** Mapea el nombre de una categoria de bienestar a un emoji representativo. */
export function categoryIcon(name: string | null | undefined): string {
  const norm = (name ?? '')
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .trim();

  if (norm.includes('yoga')) return '\u{1F9D8}';
  if (norm.includes('pilates')) return '\u{1F938}';
  if (norm.includes('hielo') || norm.includes('breathwork')) return '\u{1F9CA}';
  if (norm.includes('arte') || norm.includes('creatividad')) return '\u{1F3A8}';
  if (norm.includes('movimiento')) return '\u{1F3C3}';
  if (norm.includes('deporte')) return '\u{1F4AA}';
  if (norm.includes('meditacion') || norm.includes('mindfulness')) return '\u{1F9E0}';
  if (norm.includes('sonido') || norm.includes('vibracion')) return '\u{1F3B5}';
  if (norm.includes('espiritualidad') || norm.includes('energia')) return '✨';
  if (norm.includes('nutricion') || norm.includes('cocina')) return '\u{1F372}';
  if (norm.includes('psicologia')) return '\u{1F331}';
  if (norm.includes('cuerpo') || norm.includes('salud')) return '\u{1F486}';
  if (norm.includes('maternidad') || norm.includes('familia')) return '\u{1F931}';
  if (norm.includes('emprendimiento')) return '\u{1F680}';
  return '✨';
}
