export interface Photo {
    url: string;
  }
  
  export interface Site {
    id: number;
    nom: string;
    slug: string;
    photos: { url: string }[];
    last_modified: string;
    modified_by_userid: number;
    statut_validation: string;
    monosite: string;
    // Ajoutez d'autres propriétés si nécessaire
  }
  
  