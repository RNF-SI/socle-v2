from app import db

from geoalchemy2 import Geometry

from flask_sqlalchemy import SQLAlchemy

# db = SQLAlchemy()
 
class TInfosBaseSite(db.Model):
    __tablename__ = 't_infos_base_site'
    
    id_site = db.Column(db.Integer, db.ForeignKey('site.id_site'), primary_key=True, nullable=False)
    reserve_created_on_geological_basis = db.Column(db.Boolean, nullable=False)
    reserve_contains_geological_heritage_inpg = db.Column(db.Boolean)
    reserve_contains_geological_heritage_other = db.Column(db.String)
    protection_perimeter_contains_geological_heritage_inpg = db.Column(db.Boolean)
    protection_perimeter_contains_geological_heritage_other = db.Column(db.String)
    main_geological_interests_stratigraphic = db.Column(db.Boolean)
    main_geological_interests_paleontological = db.Column(db.Boolean)
    main_geological_interests_sedimentological = db.Column(db.Boolean)
    main_geological_interests_geomorphological = db.Column(db.Boolean)
    main_geological_interests_mineral_resource = db.Column(db.Boolean)
    main_geological_interests_mineralogical = db.Column(db.Boolean)
    main_geological_interests_metamorphism = db.Column(db.Boolean)
    main_geological_interests_volcanism = db.Column(db.Boolean)
    main_geological_interests_plutonism = db.Column(db.Boolean)
    main_geological_interests_hydrogeology = db.Column(db.Boolean)
    main_geological_interests_tectonics = db.Column(db.Boolean)
    contains_paleontological_heritage = db.Column(db.Boolean)
    contains_paleontological_heritage_vertebrates = db.Column(db.Boolean)
    contains_paleontological_heritage_invertebrates = db.Column(db.Boolean)
    contains_paleontological_heritage_plants = db.Column(db.Boolean)
    contains_paleontological_heritage_trace_fossils = db.Column(db.Boolean)
    contains_paleontological_heritage_other = db.Column(db.Boolean)
    contains_paleontological_heritage_other_details = db.Column(db.String)  # Nouveau champ
    reserve_has_geological_collections = db.Column(db.Boolean, nullable=False)
    reserve_has_exhibition = db.Column(db.Boolean, nullable=False)
    geological_age = db.Column(db.String)
    etage = db.Column(db.String)
    ere_periode_epoque = db.Column(db.String)
    reserve_contains_stratotype = db.Column(db.Boolean)
    stratotype_limit = db.Column(db.Boolean)  # Nouveau champ
    stratotype_limit_input = db.Column(db.String)  # Nouveau champ
    stratotype_stage = db.Column(db.Boolean)  # Nouveau champ
    stratotype_stage_input = db.Column(db.String)  # Nouveau champ
    contains_subterranean_habitats = db.Column(db.Boolean)
    subterranean_habitats_natural_cavities = db.Column(db.Boolean)
    subterranean_habitats_anthropogenic_cavities = db.Column(db.Boolean)
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
    slug = db.Column(db.String(255), unique=True)

cor_site_inpg = db.Table('cor_site_inpg',
    db.Column('site_id', db.Integer, db.ForeignKey('site.id_site', ondelete="CASCADE")),
    db.Column('inpg_id', db.Integer, db.ForeignKey('inpg.id_inpg', ondelete="CASCADE"))
)

class Site(db.Model):
    __tablename__ = 'site'

    id_site = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    nom = db.Column(db.String(255), nullable=False)
    altitude_max = db.Column(db.Float, nullable=True)
    altitude_min = db.Column(db.Float, nullable=True)
    bassin_hydro_general = db.Column(db.String(255), nullable=True)
    bassin_hydro_rapproche = db.Column(db.String(255), nullable=True)
    observations_in_situ = db.Column(db.Text, nullable=True)
    liste_docs_geol = db.Column(db.Text, nullable=True)
    autres_cartes_geol = db.Column(db.Text, nullable=True)
    statut_validation = db.Column(db.String(20), nullable=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326), nullable=True)
    date_ajout = db.Column(db.DateTime, default=db.func.now(), nullable=False)
    date_maj = db.Column(db.DateTime, nullable=False)
    utilisateur_ajout = db.Column(db.Integer, nullable=True)
    utilisateur_maj = db.Column(db.Integer, nullable=True)

    slug = db.Column(db.String(255), unique=True)# ajouter slug  

    infos_base = db.relationship("TInfosBaseSite", backref="site", foreign_keys=TInfosBaseSite.id_site)

    inpg = db.relationship(
        'Inpg',
        secondary=cor_site_inpg,
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
    url = db.Column(db.String(254))
    nombre_etoiles = db.Column(db.Integer)
    phenomene_geologique = db.Column(db.String)
    interet_geol_principal = db.Column(db.String)
    age_des_terrains_le_plus_recent = db.Column(db.String)
    age_des_terrains_le_plus_ancien = db.Column(db.String)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326), nullable=True)

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