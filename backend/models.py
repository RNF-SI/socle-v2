from app import db

from geoalchemy2 import Geometry

from flask_sqlalchemy import SQLAlchemy

# db = SQLAlchemy()
# ajouter classe MiniQuest
class MiniQuest(db.Model):
    __tablename__= 'mini_quest'
    __table_args__ = {'schema': 'public'}

    id_mini = db.Column(db.Integer, primary_key=True)
    reserve_created_on_geological_basis = db.Column(db.Boolean)  # Indique si la réserve a été créée sur une base géologique
    reserve_contains_geological_heritage = db.Column(db.String(200))  # Indique si la réserve contient un patrimoine géologique
    protection_perimeter_contains_geological_heritage = db.Column(db.String(200))  # Indique si le périmètre de protection contient un patrimoine géologique
    main_geological_interests = db.Column(db.String(200))  # Principaux intérêts géologiques de la réserve
    contains_paleontological_heritage = db.Column(db.String(200))  # Indique si la réserve contient un patrimoine paléontologique
    reserve_has_geological_collections = db.Column(db.Boolean)  # Indique si la réserve possède des collections géologiques
    reserve_has_exhibition = db.Column(db.Boolean)  # Indique si la réserve a des expositions géologiques
    geological_age = db.Column(db.String(200))  # Âge géologique de la réserve
    reserve_contains_stratotype = db.Column(db.String(200))  # Indique si la réserve contient un stratotype
    contains_subterranean_habitats = db.Column(db.String(200))  # Indique si la réserve contient des habitats souterrains
    associated_with_mineral_resources = db.Column(db.String(200))  # Indique si la réserve est associée à des ressources minérales
    has_geological_site_for_visitors = db.Column(db.Boolean)  # Indique si la réserve a un site géologique pour les visiteurs
    offers_geodiversity_activities = db.Column(db.Boolean)  # Indique si la réserve propose des activités de géodiversité
    slug = db.Column(db.String(255), unique=True)# ajouter slug  
    
class Site(db.Model):
    __tablename__ = 'site'

    id_site = db.Column(db.Integer, primary_key=True, nullable=False)
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

   