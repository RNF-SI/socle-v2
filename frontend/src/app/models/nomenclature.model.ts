export interface Nomenclature {
    id_nomenclature: number;
    id_parent: number;
    label: string;
    mnemonique: string;
    definition: string | null;
    hierarchy: string | null;
    id_type: number;
    source: string | null;
    statut: string | null;
  }

  export interface NomenclatureType {
    definition: null,
    id_type: number,
    label: string,
    mnemonique: string,
    nomenclatures: Nomenclature[],
    source: string,
    statut: null
  }