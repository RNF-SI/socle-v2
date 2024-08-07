export interface PatrimoineGeologique {
    id_patrimoine?: number;  // Ajoutez ceci si vous avez besoin de l'ID pour les mises à jour
    lb: string;
    nombre_etoiles: number;
    interet_geol_principal: string;
    age_des_terrains_le_plus_recent: string;
    age_des_terrains_le_plus_ancien: string;
    bibliographie: string;  // Nouveau champ
}