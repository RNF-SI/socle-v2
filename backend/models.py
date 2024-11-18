from app import db

from geoalchemy2 import Geometry

from flask_sqlalchemy import SQLAlchemy


# db = SQLAlchemy()
 
class TInfosBaseSite(db.Model):
    __tablename__ = 't_infos_base_site'
    
    id_site = db.Column(db.Integer, db.ForeignKey('site.id_site'), primary_key=True, nullable=False)
    # reserve_created_on_geological_basis = db.Column(db.Boolean, nullable=False)
    # protection_perimeter_contains_geological_heritage_inpg = db.Column(db.Boolean)
    # protection_perimeter_contains_geological_heritage_other = db.Column(db.String)
    # main_geological_interests_stratigraphic = db.Column(db.Boolean)
    # main_geological_interests_paleontological = db.Column(db.Boolean)
    # main_geological_interests_sedimentological = db.Column(db.Boolean)
    # main_geological_interests_geomorphological = db.Column(db.Boolean)
    # main_geological_interests_mineral_resource = db.Column(db.Boolean)
    # main_geological_interests_mineralogical = db.Column(db.Boolean)
    # main_geological_interests_metamorphism = db.Column(db.Boolean)
    # main_geological_interests_volcanism = db.Column(db.Boolean)
    # main_geological_interests_plutonism = db.Column(db.Boolean)
    # main_geological_interests_hydrogeology = db.Column(db.Boolean)
    # main_geological_interests_tectonics = db.Column(db.Boolean)
    # contains_paleontological_heritage = db.Column(db.Boolean)
    contains_paleontological_heritage_vertebrates = db.Column(db.Boolean)
    contains_paleontological_heritage_invertebrates = db.Column(db.Boolean)
    contains_paleontological_heritage_plants = db.Column(db.Boolean)
    contains_paleontological_heritage_trace_fossils = db.Column(db.Boolean)
    # contains_paleontological_heritage_other = db.Column(db.Boolean)
    contains_paleontological_heritage_other_details = db.Column(db.String)  
    reserve_has_geological_collections = db.Column(db.Boolean)
    reserve_has_exhibition = db.Column(db.Boolean)
    geological_units = db.Column(db.ARRAY(db.Integer))  # Ajoutez ce champ pour stocker les IDs des unités géologiques sélectionnées.
    geological_units_other = db.Column(db.String)
    # reserve_contains_stratotype = db.Column(db.Boolean)
    # stratotype_limit = db.Column(db.Boolean)   
    # stratotype_limit_input = db.Column(db.String) 
    # stratotype_stage = db.Column(db.Boolean)   
    # stratotype_stage_input = db.Column(db.String)   
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
    offers_geodiversity_activities = db.Column(db.Boolean)
    # slug = db.Column(db.String(255), unique=True)

cor_site_inpg = db.Table('cor_site_inpg',
    db.Column('site_id', db.Integer, db.ForeignKey('site.id_site', ondelete="CASCADE")),
    db.Column('inpg_id', db.Integer, db.ForeignKey('inpg.id_inpg', ondelete="CASCADE"))
)

cor_site_ages = db.Table('cor_site_ages',
    db.Column('site_id', db.Integer, db.ForeignKey('site.id_site', ondelete="CASCADE")),
    db.Column('nomenclature_id', db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature', ondelete="CASCADE"))
)

cor_site_stratotype = db.Table('cor_site_stratotype',
    db.Column('site_id', db.Integer, db.ForeignKey('site.id_site', ondelete="CASCADE")),
    db.Column('stratotype_id', db.Integer, db.ForeignKey('t_stratotypes.id_stratotype', ondelete="CASCADE"))
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
    region = db.Column(db.String(100), nullable=False)  # Nouveau champ pour la région
    creation_geol = db.Column(db.Boolean) # Ajout d'un champ pour définir si la réserve a été créée pour son patrimoine géologique


    perimetre_protection_site = db.relationship("Site", remote_side=[id_site])

    infos_base = db.relationship("TInfosBaseSite", foreign_keys=TInfosBaseSite.id_site, uselist=False)

    inpg = db.relationship(
        'Inpg',
        secondary=cor_site_inpg,
        passive_deletes=True,
        order_by="desc(Inpg.nombre_etoiles)"
    )

    ages = db.relationship(
        'Nomenclature',
        secondary=cor_site_ages,
        passive_deletes=True
    )

    patrimoines_geologiques = db.relationship('PatrimoineGeologiqueGestionnaire', backref='site', passive_deletes=True)
    
    substances = db.relationship("CorSiteSubstance")

    stratotypes = db.relationship(
        'Stratotype',
        secondary=cor_site_stratotype,
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

    id_inpg = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    id_metier = db.Column(db.String(7), nullable=True)
    lb_site = db.Column(db.String(254))
    nombre_etoiles = db.Column(db.Integer)
    phenomene_geologique = db.Column(db.String)
    interet_geol_principal = db.Column(db.String)
    # age_des_terrains_le_plus_recent = db.Column(db.String)
    # age_des_terrains_le_plus_ancien = db.Column(db.String)
    niveau_de_diffusion = db.Column(db.String)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326), nullable=True)
    
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

