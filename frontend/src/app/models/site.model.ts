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
  // Réserve sortie du réseau. RADIS déclasse au lieu de supprimer : le site
  // disparaît des listes mais sa fiche géologique reste consultable, d'où le
  // bandeau d'avertissement de la synthèse.
  ancienne_reserve?: boolean;
  date_declassement?: string;
  raison_declassement?: string;
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
  substances: any;
  completion: number;

  sfgeol: Sfgeol[];

  modifications: Modifications[];

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
  /** Ensemble géologique saisi librement via « Autre ». */
  geological_units_other: string | null;
  // Les questions du questionnaire valent null tant qu'elles n'ont pas été
  // renseignées : le type doit le refléter, sinon « non renseigné » et « non »
  // deviennent indiscernables à la lecture.
  associated_with_mineral_resources: boolean | null;
  mineral_resources_old_quarry: boolean;
  mineral_resources_active_quarry: boolean;
  mineral_resources_old_mine: boolean;
  mineral_resources_active_mine: boolean;
  reserve_has_geological_collections: boolean | null;
  reserve_has_geological_site_for_visitors: boolean | null;
  nb_sites_for_visitors: number;
  offers_geodiversity_activities: boolean | null;
  user_update: string;
  date_update: Date;
  biblio: Text;
}

export interface Stratotype {
  id_stratotype: number;
  libelle: string;
  type: string;
  actif: boolean;
  costratotype: boolean;
  ancien: boolean;
}

export interface Sfgeol {
  ogc_fid: number;
  descr: string;
}

export interface Modifications {
  changements: string[];
  user_update: string;
  date_update: Date;
}