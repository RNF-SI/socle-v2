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
  sites_inpg: any;
  patrimoines_geologiques: any;
  perimetre_protection: any;
  interet_geol_principal: any;
  nom: string;
  superficie: number;
  sitesInpg: number;
  geopatrimoineSites: number;
  stratotypes: Stratotype[];
  terrainsAncien: string;
  terrainsRecent: string;
  infos_base: Infos_base;
  creation_geol: boolean;
  geom: any;
  jonction_nom: any;
  surf_off: any;
  // WTF : je ne comprend pas du tout ce modèle, il ne correspond pas du tout à sites...
}

export interface Infos_base {
  reserve_contains_stratotype: boolean;
  contains_subterranean_habitats: boolean;
  subterranean_habitats_natural_cavities: boolean;
  subterranean_habitats_anthropogenic_cavities: boolean;
  contains_paleontological_heritage: boolean;
  contains_paleontological_heritage_invertebrates: boolean;
  contains_paleontological_heritage_vertebrates: boolean;
  contains_paleontological_heritage_plants: boolean;
  contains_paleontological_heritage_trace_fossils: boolean;
  contains_paleontological_heritage_other_details: string;
  geological_units: number[];
}

export interface Stratotype {
  id_stratotype: number;
  libelle: string;
  type: string;
  actif: boolean;
  costratotype: boolean;
  ancien: boolean;
}