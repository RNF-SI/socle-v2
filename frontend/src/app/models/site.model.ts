export interface Photo {
    url: string;
  }
  
  export interface Site {
    reserve_created_on_geological_basis?: boolean;  // Ajoute cette ligne
    region: string;
    has_patrimoine_geologique: any;
    hasPatrimoine: boolean;
    code: string;
    type_rn: string;
    id_metier?: { id: string, url: string }[];  // Met à jour ce champ
    total_sites_without_protection: number;
    id_site: Site;
    id: number;
     
    slug: string;
    photos: { url: string }[];
    last_modified: string;
    modified_by_userid: number;
    statut_validation: string;
    
    monosite: string;
    inpg: any;
    perimetre_protection: any;
    interet_geol_principal: any;
    nom: string;
    superficie: number;
    sitesInpg: number;
    geopatrimoineSites: number;
    stratotypes: number;
    terrainsAncien: string;
    terrainsRecent: string;

   
  
  }
  
  