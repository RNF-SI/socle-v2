export interface Photo {
    url: string;
  }
  
  export interface Site {
    id: number;
    nom: string;
    photos: Photo[];
    last_modified?: string;
    modified_by_userid?: number;
    statut_validation?: string;
    monosite?: string;
  }
  