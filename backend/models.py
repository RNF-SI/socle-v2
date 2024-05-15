from app import db

from geoalchemy2 import Geometry

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
    # utilisateur_ajout = db.Column(db.Integer, nullable=True)
    # utilisateur_maj = db.Column(db.Integer, nullable=True)

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