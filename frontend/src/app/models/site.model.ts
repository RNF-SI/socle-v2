export interface Photo {
    url: string;
  }
  
  export interface Site {
    total_sites_without_protection: number;
    id_site: Site;
    id: number;
    nom: string;
    slug: string;
    photos: { url: string }[];
    last_modified: string;
    modified_by_userid: number;
    statut_validation: string;
    
    monosite: string;
    inpg: any;
    perimetre_protection: any;
    interet_geol_principal: any;
   
  
  }
  
  