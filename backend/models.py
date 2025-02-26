from app import db

from geoalchemy2 import Geometry

from flask_sqlalchemy import SQLAlchemy


# db = SQLAlchemy()
 
class TInfosBaseSite(db.Model):
    __tablename__ = 't_infos_base_site'
    
    id_site = db.Column(db.Integer, db.ForeignKey('site.id_site'), primary_key=True, nullable=False)
    contains_paleontological_heritage_vertebrates = db.Column(db.Boolean)
    contains_paleontological_heritage_invertebrates = db.Column(db.Boolean)
    contains_paleontological_heritage_plants = db.Column(db.Boolean)
    contains_paleontological_heritage_trace_fossils = db.Column(db.Boolean)
    contains_paleontological_heritage_other_details = db.Column(db.String)  
    reserve_has_geological_collections = db.Column(db.Boolean)
    reserve_has_exhibition = db.Column(db.Boolean)
    geological_units = db.Column(db.ARRAY(db.Integer))  # Ajoutez ce champ pour stocker les IDs des unités géologiques sélectionnées.
    geological_units_other = db.Column(db.String)
    contains_subterranean_habitats = db.Column(db.Boolean)
    subterranean_habitats_natural_cavities = db.Column(db.Boolean)
    subterranean_habitats_anthropogenic_cavities = db.Column(db.Boolean)
    # TODO : ça sert à rien si les enfant sont true alors le parent est true et inversement
    associated_with_mineral_resources = db.Column(db.Boolean)
    mineral_resources_old_quarry = db.Column(db.Boolean)
    mineral_resources_active_quarry = db.Column(db.Boolean)
    quarry_extracted_material = db.Column(db.String)
    quarry_fossiliferous_material = db.Column(db.Boolean)
    mineral_resources_old_mine = db.Column(db.Boolean)
    mineral_resources_active_mine = db.Column(db.Boolean)
    mine_extracted_material = db.Column(db.String)
    mine_fossiliferous_material = db.Column(db.Boolean)
    reserve_has_geological_site_for_visitors = db.Column(db.Boolean)
    nb_sites_for_visitors = db.Column(db.Integer)
    site_for_visitors_free_access = db.Column(db.Boolean)
    offers_geodiversity_activities = db.Column(db.Boolean)
    biblio = db.Column(db.Text)
    user_update = db.Column(db.String) # référence l'utilisateur de UsersHub qui a fait la modif
    date_update = db.Column(db.DateTime)


cor_site_ages = db.Table('cor_site_ages',
    db.Column('site_id', db.Integer, db.ForeignKey('site.id_site', ondelete="CASCADE")),
    db.Column('nomenclature_id', db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature', ondelete="CASCADE"))
)

cor_site_stratotype = db.Table('cor_site_stratotype',
    db.Column('site_id', db.Integer, db.ForeignKey('site.id_site', ondelete="CASCADE")),
    db.Column('stratotype_id', db.Integer, db.ForeignKey('t_stratotypes.id_stratotype', ondelete="CASCADE"))
)

cor_site_sfgeol = db.Table('cor_site_sfgeol',
    db.Column('site_id', db.Integer, db.ForeignKey('site.id_site', ondelete="CASCADE")),
    db.Column('sfgeol_id', db.Integer, db.ForeignKey('infoterre.s_fgeol.ogc_fid', ondelete="CASCADE"))
)

class Site(db.Model):
    __tablename__ = 'site'

    id_site = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    perimetre_protection = db.Column(db.Boolean, default=False)  
    id_perimetre_protection = db.Column(db.Integer, db.ForeignKey('site.id_site'), nullable=True)  
    nom = db.Column(db.String(255), nullable=False)
    jonction_nom =db.Column(db.String)
    altitude_max = db.Column(db.Float, nullable=True)
    altitude_min = db.Column(db.Float, nullable=True)
    bassin_hydro_general = db.Column(db.String(255), nullable=True)
    bassin_hydro_rapproche = db.Column(db.String(255), nullable=True)
    observations_in_situ = db.Column(db.Text, nullable=True)
    liste_docs_geol = db.Column(db.Text, nullable=True)
    autres_cartes_geol = db.Column(db.Text, nullable=True)
    statut_validation = db.Column(db.String(20), nullable=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326), nullable=True)
    geom_point = db.Column(Geometry('POINT', srid=4326), nullable=True)  
    date_ajout = db.Column(db.DateTime, default=db.func.now(), nullable=False)
    date_maj = db.Column(db.DateTime, nullable=False)
    utilisateur_ajout = db.Column(db.Integer, nullable=True)
    utilisateur_maj = db.Column(db.Integer, nullable=True)
    surf_off = db.Column(db.Float)

    slug = db.Column(db.String(255), unique=True) 

    type_rn = db.Column(db.String(3), nullable=False)  # RNN, RNR, RNC etc.
    code = db.Column(db.String(10), nullable=True)  # Ajout du champ 'code'
    region = db.Column(db.String(100), nullable=True)  # Nouveau champ pour la région
    creation_geol = db.Column(db.Boolean) # Ajout d'un champ pour définir si la réserve a été créée pour son patrimoine géologique


    perimetre_protection_site = db.relationship("Site", remote_side=[id_site])

    infos_base = db.relationship("TInfosBaseSite", foreign_keys=TInfosBaseSite.id_site, uselist=False)

    # inpg = db.relationship(
    #     'Inpg',
    #     secondary=cor_site_inpg,
    #     passive_deletes=True,
    #     order_by="desc(Inpg.nombre_etoiles)"
    # )

    ages = db.relationship(
        'Nomenclature',
        secondary=cor_site_ages,
        passive_deletes=True
    )

    patrimoines_geologiques = db.relationship('PatrimoineGeologiqueGestionnaire', backref='site', passive_deletes=True)
    
    substances = db.relationship("CorSiteSubstance")

    sites_inpg = db.relationship("CorSiteInpg")

    stratotypes = db.relationship(
        'Stratotype',
        secondary=cor_site_stratotype,
        passive_deletes=True
    )

    sfgeol = db.relationship(
        'SFGeol',
        secondary=cor_site_sfgeol,
        passive_deletes=True
    )


class EntiteGeol(db.Model):
    __tablename__ = 'entite_geol'

    id_entite = db.Column(db.Integer, primary_key=True, nullable=False)
    intitule = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(10), nullable=True)
    quantite_affleurements = db.Column(db.String(50), nullable=True)
    affleurements_accessibles = db.Column(db.Boolean, nullable=True)
    permeabilite = db.Column(db.String(50), nullable=True)
    presence_aquifere = db.Column(db.Boolean, nullable=True)
    niveau_sources = db.Column(db.Boolean, nullable=True)
    complements = db.Column(db.Text, nullable=True)
    geom = db.Column(Geometry('MULTIPOINT', srid=4326), nullable=True)
    # ere_geol_id = db.Column(db.Integer, db.ForeignKey('echelle_geol.id'), nullable=True)
    site_id = db.Column(db.Integer, db.ForeignKey('site.id_site'), nullable=False)
    nom_carte = db.Column(db.String(254), nullable=True)
    s_fgeol_id = db.Column(db.Integer, nullable=True)
    date_ajout = db.Column(db.DateTime, default=db.func.now(), nullable=False)
    date_maj = db.Column(db.DateTime, nullable=False)
    utilisateur_ajout = db.Column(db.Integer, nullable=True)
    utilisateur_maj = db.Column(db.Integer, nullable=True)

    # echelle_geol = db.relationship('EchelleGeol', backref='entite_geol')
    site = db.relationship('Site', backref='entites_geol')

class Inpg(db.Model):
    __tablename__ = 'inpg'
    __table_args__ = {'schema': 'public'}
    
    id_inpg = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    geom = db.Column(Geometry('MULTIPOLYGON', 4326))
    id_metier = db.Column(db.String(200))
    surface = db.Column(db.String(200))
    lb_site = db.Column(db.String)
    typologie_1 = db.Column(db.String)
    typologie_2 = db.Column(db.String)
    typologie_3 = db.Column(db.String)
    accessibilite_1 = db.Column(db.String)
    accessibilite_2 = db.Column(db.String)
    region = db.Column(db.String)
    departements = db.Column(db.String)
    communes = db.Column(db.String)
    niveau_de_diffusion = db.Column(db.String)
    organismes_contacts = db.Column(db.String)
    superficie_saisie = db.Column(db.Float)
    justification_de_superficie = db.Column(db.String)
    unite_de_superficie = db.Column(db.String)
    etat_de_conservation = db.Column(db.String)
    presentation_succinte = db.Column(db.String)
    description_physique = db.Column(db.String)
    description_geologique = db.Column(db.String)
    itineraire_dacces = db.Column(db.String)
    code_gilges = db.Column(db.String)
    phenomene_geologique = db.Column(db.String)
    interet_geol_principal = db.Column(db.String)
    justification_interet_geologique_principal = db.Column(db.String)
    interets_geologiques_secondaires = db.Column(db.String)
    interets_geologiques_secondaires_avec_justification = db.Column(db.String)
    interets_pedagogiques = db.Column(db.String)
    justification_interets_pedagogiques = db.Column(db.String)
    interets_annexes = db.Column(db.String)
    interets_annexes_avec_justification = db.Column(db.String)
    interet_histoire_sciences_geologiques = db.Column(db.String)
    rarete = db.Column(db.String)
    informateurs = db.Column(db.String)
    stratigraphie__ge_le_plus_ancien_du_phenomene = db.Column(db.String)
    stratigraphie__ge_le_plus_recent_du_phenomene = db.Column(db.String)
    stratigraphie__ge_le_plus_ancien_du_terrain = db.Column(db.String)
    stratigraphie__ge_le_plus_recent_du_terrain = db.Column(db.String)
    commentaire_sur_levaluation_du_site = db.Column(db.String)
    vulnerabilite_naturelle = db.Column(db.String)
    menace_anthropique = db.Column(db.String)
    commentaire_besoin_de_protection = db.Column(db.String)
    commentaire_general_sur_les_menaces = db.Column(db.String)
    note_geologique_principale = db.Column(db.Integer)
    note_geologique_secondaire = db.Column(db.Integer)
    note_pedagogique = db.Column(db.Integer)
    note_histoire_des_sciences = db.Column(db.Integer)
    note_rarete = db.Column(db.Integer)
    note_etat_conservation = db.Column(db.Integer)
    note_interet_patrimonial = db.Column(db.Integer)
    nombre_etoiles = db.Column(db.Integer)
    note_vulnerabilite_naturelle = db.Column(db.Integer)
    note_menace_anthropique = db.Column(db.Integer)
    note_protection_effective = db.Column(db.Integer)
    note_besoin_de_protection = db.Column(db.Integer)
    lieudit = db.Column(db.String)
    nombre_de_documentations = db.Column(db.Integer)
    legendes_figures = db.Column(db.String)
    cartes_geologiques_associees = db.Column(db.String)
    cartes_ign_associees = db.Column(db.String)
    cartes_marines_associees = db.Column(db.String)
    zonages_de_reference = db.Column(db.String)
    bibliographies_associees = db.Column(db.String)
    collections_associees = db.Column(db.String)
    associations_avec_dautres_sites = db.Column(db.String)
    date_de_premiere_visite = db.Column(db.String)
    date_de_derniere_visite = db.Column(db.String)
    date_creation_du_site = db.Column(db.String)
    statut_actuel_de_la_fiche = db.Column(db.String)
    ancien_statut_de_la_fiche = db.Column(db.String)
    statut_de_validation_metier = db.Column(db.String)
    statut_de_validation_crpg = db.Column(db.String)
    statut_de_validation_regionale = db.Column(db.String)
    statut_de_validation_nationale = db.Column(db.String)
    statut_de_dept_sig = db.Column(db.String)
    statut_de_validation_sig = db.Column(db.String)
    statut_de_diffusion_inpn = db.Column(db.String)
    derniere_date_de_modification_de_la_fiche = db.Column(db.String)
    date_de_validation_metier = db.Column(db.String)
    date_de_validation_crpg_actuelle = db.Column(db.String)
    date_de_premiere_validation_regionale = db.Column(db.String)
    date_de_validation_regionale_actuelle = db.Column(db.String)
    date_de_premiere_validation_nationale = db.Column(db.String)
    date_de_validation_nationale_actuelle = db.Column(db.String)
    date_de_premiere_diffusion = db.Column(db.String)
    date_de_diffusion_actuelle = db.Column(db.String)

    __table_args__ = (db.Index('sidx_import_inpg_geom', 'geom', postgresql_using='gist'),)
    
class PatrimoineGeologiqueGestionnaire(db.Model):
    __tablename__ = 'patrimoine_geologique_gestionnaire'

    id_patrimoine = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    id_site = db.Column(db.Integer, db.ForeignKey('site.id_site'), nullable=False)
    lb = db.Column(db.String(254))
    interet_geol_principal = db.Column(db.String)
    nombre_etoiles = db.Column(db.Integer)
    age_des_terrains_le_plus_recent = db.Column(db.String)
    age_des_terrains_le_plus_ancien = db.Column(db.String)
    bibliographie = db.Column(db.Text)   
    
class Nomenclature(db.Model):
    __tablename__ = 't_nomenclatures'

    id_nomenclature = db.Column(db.Integer, primary_key=True)
    id_type = db.Column(db.Integer, db.ForeignKey('bib_nomenclatures_types.id_type'))
    mnemonique = db.Column(db.String)
    label = db.Column(db.String)
    definition = db.Column(db.Text)
    source = db.Column(db.String)
    statut = db.Column(db.String)
    hierarchy = db.Column(db.String)
    id_parent = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))

class BibNomenclatureType(db.Model):
    __tablename__ = 'bib_nomenclatures_types'

    id_type = db.Column(db.Integer, primary_key=True)
    mnemonique = db.Column(db.String)
    label = db.Column(db.String)
    definition = db.Column(db.Text)
    source = db.Column(db.String)
    statut = db.Column(db.String)

    nomenclatures = db.relationship("Nomenclature", foreign_keys=Nomenclature.id_type)

     # Retourne les nomenclatures triées par 'label'
    @property
    def sorted_nomenclatures(self):
        return sorted(self.nomenclatures, key=lambda x: x.label)

class CorSiteSubstance(db.Model):
    __tablename__= 'cor_site_substance'

    site_id = db.Column(db.Integer, db.ForeignKey('site.id_site', ondelete='CASCADE'), primary_key= True)
    substance_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'), primary_key= True)
    fossilifere = db.Column(db.Boolean)

    site = db.relationship("Site", back_populates="substances")
    substance = db.relationship("Nomenclature")

class Stratotype(db.Model):
    __tablename__= 't_stratotypes'

    id_stratotype = db.Column(db.Integer, primary_key=True)
    libelle = db.Column(db.String)
    type = db.Column(db.String)
    actif = db.Column(db.Boolean)
    costratotype = db.Column(db.Boolean)
    ancien = db.Column(db.Boolean)

class CorSiteInpg(db.Model):
    __tablename__= 'cor_site_inpg'

    site_id = db.Column(db.Integer, db.ForeignKey('site.id_site', ondelete='CASCADE'), primary_key= True)
    inpg_id = db.Column(db.Integer, db.ForeignKey('inpg.id_inpg', ondelete='CASCADE'), primary_key= True)
    active = db.Column(db.Boolean)
    raison_desactive = db.Column(db.String)

    site = db.relationship("Site", back_populates="sites_inpg")
    inpg = db.relationship("Inpg")

class Parametres(db.Model) :
    __tablename__= 't_parametres'

    id_parametre = db.Column(db.Integer, primary_key=True)
    libelle = db.Column(db.String)
    valeur = db.Column(db.String)

class SFGeol(db.Model):
    __tablename__ = 's_fgeol'
    __table_args__ = (
        db.Index('fki_fk_s_fgeol_age_deb', 'age_deb_id'),
        db.Index('fki_fk_s_fgeol_age_fin', 'age_fin_id'),
        db.Index('s_fgeol_wkb_geometry_geom_idx', 'wkb_geometry', postgresql_using='gist'),
        {'schema': 'infoterre'}
    )
    
    ogc_fid = db.Column(db.Integer, primary_key=True, nullable=False)
    mi_prinx = db.Column(db.Integer)
    code = db.Column(db.Integer)
    code_leg = db.Column(db.Integer)
    notation = db.Column(db.String(50))
    descr = db.Column(db.String(254))
    type_geol = db.Column(db.String(254))
    ap_locale = db.Column(db.String(254))
    type_ap = db.Column(db.String(254))
    geol_nat = db.Column(db.String(254))
    isopique = db.Column(db.String(254))
    lithotec = db.Column(db.String(254))
    emerge = db.Column(db.String(4))
    sys_deb = db.Column(db.String(50))
    sys_fin = db.Column(db.String(50))
    age_min = db.Column(db.Numeric(6, 2))
    age_max = db.Column(db.Numeric(6, 2))
    age_absolu = db.Column(db.Numeric(6, 2))
    toler_age = db.Column(db.Numeric(5, 2))
    tech_dat = db.Column(db.String(254))
    cat_dat = db.Column(db.String(254))
    age_com = db.Column(db.String(254))
    lithologie = db.Column(db.String(254))
    durete = db.Column(db.String(254))
    epaisseur = db.Column(db.String(254))
    environmt = db.Column(db.String(254))
    c_geodyn = db.Column(db.String(254))
    geochimie = db.Column(db.String(254))
    litho_com = db.Column(db.String(254))
    wkb_geometry = db.Column(Geometry('POLYGON', 4326))
    age_deb_id = db.Column(db.Integer, db.ForeignKey('infoterre.echelle.id'))
    age_fin_id = db.Column(db.Integer, db.ForeignKey('infoterre.echelle.id'))

class Echelle(db.Model):
    __tablename__ = 'echelle'
    __table_args__ = (
        db.Index('fki_fk_echelle_auto', 'parent_id'),
        db.Index('idx_echelle_label', 'label'),
        {'schema': 'infoterre'}
    )
    
    id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    label = db.Column(db.String(50), nullable=False, unique=True)
    parent = db.Column(db.String(50))
    parent_id = db.Column(db.Integer, db.ForeignKey('infoterre.echelle.id'))
    age_deb = db.Column(db.Numeric)
    age_fin = db.Column(db.Numeric)
    pix_min = db.Column(db.Integer)
    pix_max = db.Column(db.Integer)

