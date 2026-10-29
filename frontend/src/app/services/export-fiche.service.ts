import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

/** Éléments de la fiche que le composant a déjà calculés pour l'affichage. */
export interface ContenuFiche {
  site: any;
  inpgActifs: any[];
  ensemblesGeologiques: { label: string }[];
  ensembleGeologiqueAutre: string;
  interetsGeologiques: string[];
  stratotypesLimite: any[];
  stratotypesEtage: any[];
  formationsGeologiques: string[];
  /** Sites INPG du périmètre de protection, hors sites écartés. */
  inpgActifsPerimetre: any[];
  /** Pictogrammes des chiffres clés, dans l'ordre d'affichage. */
  pictos?: (string | null)[];
  /** Image PNG de la carte, si la capture a réussi. */
  carte?: string | null;
  /** Image PNG de la légende de la carte, si la capture a réussi. */
  legende?: string | null;
}

const MARGE = 15;
const LARGEUR_PAGE = 210;
const HAUTEUR_PAGE = 297;
const LARGEUR_UTILE = LARGEUR_PAGE - 2 * MARGE;

const BLEU: [number, number, number] = [81, 129, 150];
const GRIS: [number, number, number] = [90, 90, 90];

/**
 * Export PDF d'une fiche de réserve.
 *
 * Le PDF est composé à partir des données, et non capturé depuis la page :
 * le texte reste sélectionnable et copiable, les sauts de page tombent entre
 * les sections, et l'export ne dépend plus du rendu du navigateur. La version
 * précédente photographiait la page entière en une seule image, qu'elle
 * posait sans pagination : tout ce qui dépassait d'une A4 était coupé, et la
 * capture échouait dès qu'une feuille de style distante refusait d'être lue.
 */
@Injectable({ providedIn: 'root' })
export class ExportFicheService {
  private doc!: jsPDF;
  private y = MARGE;

  genererPdf(contenu: ContenuFiche): void {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this.y = MARGE;

    this.enTete(contenu.site);
    this.chiffresCles(contenu);
    if (contenu.carte) {
      this.carte(contenu.carte);
      if (contenu.legende) {
        this.legende(contenu.legende);
      }
    }
    this.patrimoine(contenu);
    this.sitesInpg(contenu.inpgActifs);
    this.perimetreProtection(contenu);
    this.ressourcesEtSensibilisation(contenu.site);
    this.formations(contenu.formationsGeologiques);
    this.bibliographie(contenu.site);
    this.piedsDePage(contenu.site);

    const nom = (contenu.site?.slug || 'fiche').toString();
    this.doc.save(`socle-${nom}.pdf`);
  }

  // ---------------------------------------------------------------- sections

  private enTete(site: any): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(...BLEU);
    this.ecrire(site?.nom ?? 'Réserve naturelle', 7);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...GRIS);
    const sousTitre = [site?.code, site?.type_rn, site?.region].filter(Boolean).join(' — ');
    if (sousTitre) {
      this.ecrire(sousTitre, 6);
    }
    this.separateur();
  }

  /**
   * Bandeau de chiffres clés, à l'image de la fiche.
   *
   * Les valeurs et les libellés sont du texte — donc sélectionnables et
   * copiables — et seuls les pictogrammes sont des images, FontAwesome étant
   * une police que jsPDF ne sait pas composer sans l'embarquer.
   */
  private chiffresCles(contenu: ContenuFiche): void {
    const s = contenu.site;
    const b = s?.infos_base;

    const colonnes: { valeur: string; libelle: string }[] = [
      { valeur: s?.surf_off ? `${Math.round(s.surf_off)} ha` : '—', libelle: 'Superficie' },
      { valeur: `${contenu.inpgActifs.length}`, libelle: this.pluriel(contenu.inpgActifs.length, 'Site INPG', 'Sites INPG') },
      {
        valeur: `${(s?.patrimoines_geologiques ?? []).length}`,
        libelle: this.pluriel((s?.patrimoines_geologiques ?? []).length,
          'Autre site de géopatrimoine', 'Autres sites de géopatrimoine'),
      },
      {
        valeur: `${(s?.stratotypes ?? []).length}`,
        libelle: this.pluriel((s?.stratotypes ?? []).length, 'Stratotype', 'Stratotypes'),
      },
    ];

    if (b?.reserve_has_geological_site_for_visitors) {
      colonnes.push({
        valeur: `${b.nb_sites_for_visitors ?? ''}`.trim() || '—',
        libelle: 'Sites géologiques aménagés pour les visiteurs',
      });
    }

    this.titreSection('Chiffres clés');

    const pictos = contenu.pictos ?? [];
    const largeurColonne = LARGEUR_UTILE / colonnes.length;
    const hautBloc = this.y;
    let basMax = this.y;

    colonnes.forEach((colonne, i) => {
      const centre = MARGE + largeurColonne * i + largeurColonne / 2;
      let y = hautBloc;

      const picto = pictos[i];
      if (picto) {
        const props = this.doc.getImageProperties(picto);
        const hauteur = 7;
        const largeur = hauteur * (props.width / props.height);
        this.doc.addImage(picto, 'PNG', centre - largeur / 2, y, largeur, hauteur);
      }
      y += 11;

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(13);
      this.doc.setTextColor(...BLEU);
      this.doc.text(colonne.valeur, centre, y, { align: 'center' });
      y += 5;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...GRIS);
      const lignes = this.doc.splitTextToSize(colonne.libelle, largeurColonne - 4);
      lignes.forEach((ligne: string) => {
        this.doc.text(ligne, centre, y, { align: 'center' });
        y += 3.6;
      });

      basMax = Math.max(basMax, y);
    });

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);
    this.y = basMax + 4;
  }

  private pluriel(nb: number, singulier: string, pluriel: string): string {
    return nb > 1 ? pluriel : singulier;
  }

  private carte(image: string): void {
    this.titreSection('Carte');
    this.image(image, 120);
  }

  /** La légende suit la carte sans titre : elle en fait partie. */
  private legende(image: string): void {
    this.image(image, 25, 2);
  }

  /**
   * Place une image en conservant ses proportions.
   *
   * La hauteur se déduit des dimensions réelles de la capture ; imposer une
   * hauteur fixe sur toute la largeur utile déformait l'image. Au-delà de
   * `hauteurMax`, c'est la largeur qui est réduite, pas le ratio.
   */
  private image(image: string, hauteurMax: number, espaceApres = 6): void {
    const props = this.doc.getImageProperties(image);
    const ratio = props.height / props.width;

    let largeur = LARGEUR_UTILE;
    let hauteur = largeur * ratio;
    if (hauteur > hauteurMax) {
      hauteur = hauteurMax;
      largeur = hauteur / ratio;
    }

    const x = MARGE + (LARGEUR_UTILE - largeur) / 2;
    this.sautSiBesoin(hauteur + 4);
    this.doc.addImage(image, 'PNG', x, this.y, largeur, hauteur);
    this.y += hauteur + espaceApres;
  }

  private patrimoine(contenu: ContenuFiche): void {
    const s = contenu.site;
    this.titreSection('Patrimoine géologique');

    if (s?.creation_geol === true) {
      this.paragraphe('La réserve a été créée sur le fondement d’un patrimoine géologique.');
    } else if (contenu.inpgActifs.length > 0 || (s?.patrimoines_geologiques ?? []).length > 0) {
      this.paragraphe('La réserve abrite du patrimoine géologique, mais ce n’est pas ce dernier qui a motivé sa création.');
    } else {
      this.paragraphe('La réserve n’abrite pas de patrimoine géologique connu.');
    }

    const ensembles = contenu.ensemblesGeologiques.map(e => e.label);
    if (contenu.ensembleGeologiqueAutre) {
      ensembles.push(contenu.ensembleGeologiqueAutre);
    }
    this.sousSection('Ensemble géologique', ensembles.length ? ensembles : ['Aucun ensemble géologique sélectionné.']);

    this.sousSection('Intérêts géologiques principaux',
      contenu.interetsGeologiques.length ? contenu.interetsGeologiques : ['Aucun intérêt géologique identifié.']);

    const stratotypes = [
      ...(contenu.stratotypesLimite ?? []).map((t: any) => `Limite : ${t.libelle}`),
      ...(contenu.stratotypesEtage ?? []).map((t: any) => `Étage : ${t.libelle}`),
    ];
    this.sousSection('Stratotypes', stratotypes.length ? stratotypes : ['Aucun stratotype identifié.']);

    this.sousSection('Patrimoine paléontologique', [this.paleontologie(s?.infos_base)]);
  }

  private sitesInpg(inpg: any[]): void {
    this.titreSection('Sites INPG sur la réserve');
    if (!inpg.length) {
      this.paragraphe('Aucun.');
      return;
    }
    inpg.forEach(lien => {
      const i = lien.inpg ?? {};
      const confidentiel = i.niveau_de_diffusion === 'Confidentiel' ? ' [confidentiel]' : '';
      this.puce(`${i.lb_site ?? 'Site sans nom'} (${this.notation(i.nombre_etoiles)})${confidentiel}`);
      if (i.interet_geol_principal) {
        this.paragraphe(i.interet_geol_principal, 4, MARGE + 5);
      }
    });
  }

  /**
   * Périmètre de protection, quand la réserve en a un.
   *
   * Il porte ses propres sites INPG, souvent bien plus nombreux que ceux de la
   * réserve : les omettre amputait l'export d'une partie du patrimoine.
   */
  private perimetreProtection(contenu: ContenuFiche): void {
    const pp = contenu.site?.perimetre_protection;
    if (!pp) {
      return;
    }

    this.titreSection('Périmètre de protection');
    this.paragraphe(pp.nom ?? 'Périmètre de protection');
    if (pp.surf_off) {
      this.ligneLibelleValeur('Superficie', `${pp.surf_off} ha`);
    }

    this.sousSection('Sites INPG sur le périmètre',
      contenu.inpgActifsPerimetre.length
        ? contenu.inpgActifsPerimetre.map(lien => {
            const i = lien.inpg ?? {};
            const conf = i.niveau_de_diffusion === 'Confidentiel' ? ' [confidentiel]' : '';
            return `${i.lb_site ?? 'Site sans nom'} (${this.notation(i.nombre_etoiles)})${conf}`;
          })
        : ['Aucun.']);
  }

  private ressourcesEtSensibilisation(site: any): void {
    const b = site?.infos_base;

    this.titreSection('Ressources minérales');
    if (!b || !this.estRenseigne(b.associated_with_mineral_resources)) {
      this.paragraphe('Information non renseignée');
    } else if (b.associated_with_mineral_resources === false) {
      this.paragraphe('Pas d’exploitation de ressource minérale connue');
    } else {
      const items = [
        b.mineral_resources_old_quarry && 'Anciennes carrières',
        b.mineral_resources_active_quarry && 'Carrières en activité',
        b.mineral_resources_old_mine && 'Anciennes mines',
        b.mineral_resources_active_mine && 'Mines en activité',
      ].filter(Boolean) as string[];
      items.forEach(i => this.puce(i));
    }

    this.titreSection('Collections');
    this.paragraphe(this.troisEtats(
      b?.reserve_has_geological_collections,
      'La réserve dispose de collections géologiques propres',
      'La réserve ne dispose pas de collections géologiques propres'));

    this.titreSection('Sensibilisation');
    this.paragraphe(this.troisEtats(
      b?.reserve_has_geological_site_for_visitors,
      'La réserve dispose d’un site géologique aménagé pour les visiteurs',
      'La réserve ne dispose pas de site géologique aménagé pour les visiteurs'));
    this.paragraphe(this.troisEtats(
      b?.offers_geodiversity_activities,
      'La réserve propose des animations sur la thématique géodiversité / patrimoine géologique',
      'La réserve ne propose pas d’animation sur la thématique géodiversité / patrimoine géologique'));
  }

  private formations(formations: string[]): void {
    if (!formations.length) {
      return;
    }
    this.titreSection('Formations géologiques sur la réserve');
    formations.forEach(f => this.puce(f));
  }

  private bibliographie(site: any): void {
    const biblio = (site?.infos_base?.biblio ?? '').toString().trim();
    if (!biblio) {
      return;
    }
    this.titreSection('Bibliographie');
    // Le champ vient d'un éditeur riche : on n'en garde que le texte.
    this.paragraphe(biblio.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
  }

  private piedsDePage(site: any): void {
    const total = this.doc.getNumberOfPages();
    const date = new Date().toLocaleDateString('fr-FR');
    for (let page = 1; page <= total; page++) {
      this.doc.setPage(page);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...GRIS);
      this.doc.text(
        `SOCLE — ${site?.nom ?? ''} — exporté le ${date}`,
        MARGE, HAUTEUR_PAGE - 8);
      this.doc.text(`${page} / ${total}`, LARGEUR_PAGE - MARGE, HAUTEUR_PAGE - 8, { align: 'right' });
    }
  }

  // ------------------------------------------------------------------ outils

  /**
   * Notation d'un site INPG en toutes lettres.
   *
   * Les polices standard de jsPDF n'encodent que le jeu Windows-1252 : le
   * caractère « étoile » en sort en octets parasites.
   */
  private notation(nb: number | null | undefined): string {
    if (!nb) return 'non noté';
    return nb > 1 ? `${nb} étoiles` : '1 étoile';
  }

  private estRenseigne(valeur: unknown): boolean {
    return valeur === true || valeur === false;
  }

  private troisEtats(valeur: unknown, oui: string, non: string): string {
    if (valeur === true) return oui;
    if (valeur === false) return non;
    return 'Information non renseignée';
  }

  private paleontologie(b: any): string {
    if (!b || !this.estRenseigne(b.contains_paleontological_heritage)) {
      return 'Information non renseignée';
    }
    if (b.contains_paleontological_heritage === false) {
      return 'Aucun patrimoine paléontologique identifié.';
    }
    const types = [
      b.contains_paleontological_heritage_vertebrates && 'vertébrés',
      b.contains_paleontological_heritage_invertebrates && 'invertébrés',
      b.contains_paleontological_heritage_plants && 'végétaux',
      b.contains_paleontological_heritage_trace_fossils && 'traces fossiles',
      (b.contains_paleontological_heritage_other_details || '').trim() || null,
    ].filter(Boolean) as string[];
    return types.length ? `Patrimoine paléontologique : ${types.join(', ')}.` : 'Patrimoine paléontologique présent.';
  }

  /** Ajoute une page si le bloc à venir ne tient pas sur la page courante. */
  private sautSiBesoin(hauteur: number): void {
    if (this.y + hauteur > HAUTEUR_PAGE - MARGE - 10) {
      this.doc.addPage();
      this.y = MARGE;
    }
  }

  private ecrire(texte: string, interligne: number, x = MARGE): void {
    const lignes = this.doc.splitTextToSize(texte, LARGEUR_PAGE - x - MARGE);
    lignes.forEach((ligne: string) => {
      this.sautSiBesoin(interligne);
      this.doc.text(ligne, x, this.y);
      this.y += interligne;
    });
  }

  private titreSection(titre: string): void {
    this.sautSiBesoin(14);
    this.y += 4;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(...BLEU);
    this.ecrire(titre, 6);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
  }

  private sousSection(titre: string, lignes: string[]): void {
    this.sautSiBesoin(10);
    this.y += 2;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...GRIS);
    this.ecrire(titre, 5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    lignes.forEach(l => this.paragraphe(l, 5));
  }

  private paragraphe(texte: string, interligne = 5, x = MARGE): void {
    this.doc.setFontSize(10);
    this.ecrire(texte, interligne, x);
  }

  private puce(texte: string): void {
    this.doc.setFontSize(10);
    this.ecrire(`• ${texte}`, 5, MARGE + 2);
  }

  private ligneLibelleValeur(libelle: string, valeur: string): void {
    this.sautSiBesoin(5);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...GRIS);
    this.doc.text(`${libelle} :`, MARGE, this.y);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(valeur, MARGE + 60, this.y);
    this.y += 5;
  }

  private separateur(): void {
    this.y += 2;
    this.doc.setDrawColor(...BLEU);
    this.doc.line(MARGE, this.y, LARGEUR_PAGE - MARGE, this.y);
    this.y += 4;
  }
}
