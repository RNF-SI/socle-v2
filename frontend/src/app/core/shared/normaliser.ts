/**
 * Normalisation des textes pour les recherches et les comparaisons.
 *
 * Les noms de réserves et de régions s'écrivent indifféremment avec ou sans
 * accents et avec ou sans tirets selon la source : « Sagnes-de-la-Godivelle »
 * côté base, « sagnes de la godivelle » sous les doigts d'un utilisateur.
 * Comparer les formes normalisées évite d'exiger la saisie exacte.
 */
export function normaliserTexte(valeur: string | null | undefined): string {
  if (!valeur) {
    return '';
  }

  return valeur
    .normalize('NFD')
    // Supprime les diacritiques laissés par la décomposition NFD
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // Tirets, apostrophes et soulignés deviennent des espaces
    .replace(/[-–—'’_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Régions d'une réserve.
 *
 * Une réserve à cheval sur deux régions est stockée en une seule chaîne
 * séparée par des virgules — « Auvergne-Rhône-Alpes, Occitanie » — qu'il faut
 * découper pour que le filtre par région la retrouve.
 */
export function regionsDuSite(region: string | null | undefined): string[] {
  return (region ?? '')
    .split(',')
    .map((part) => normaliserTexte(part))
    .filter((part) => part.length > 0);
}
