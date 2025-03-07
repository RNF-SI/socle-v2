import site
from venv import logger
from flask import Flask, request, Response, render_template, redirect, Blueprint, jsonify, g, abort, current_app
import requests
import json
from app import app, db, mail
from models import PatrimoineGeologiqueGestionnaire, Site, TInfosBaseSite, Nomenclature, BibNomenclatureType,Inpg, Site, CorSiteInpg, CorSiteSubstance, Stratotype, Parametres, Echelle, SFGeol, SuivisModifs
from schemas import PatrimoineGeologiqueGestionnaireSchema, PerimetreProtectionSchema, TInfosBaseSiteSchema, SiteSchema, NomenclatureSchema, NomenclatureTypeSchema, SiteSchemaSimple, StratotypeSchema, ParametresSchema, SuivisModifsSchema
from pypnusershub import routes as fnauth
import logging
from sqlalchemy import func
from sqlalchemy.orm import joinedload, load_only
import datetime
from flask_mail import Message

bp = Blueprint('routes', __name__)

logging.basicConfig(level=logging.DEBUG)

@bp.route('/site/<slug>', methods=['GET'])
def getSiteBySlug(slug):
    site = Site.query.filter_by(slug=slug).first()
    if site is None:
        abort(404)
    schema = SiteSchema()
    return schema.jsonify(site)

@bp.route('/site/id_local/<id_local>', methods=['GET'])
def getSiteByIdLocal(id_local):
    site = Site.query.filter_by(code=id_local).first()
    if site is None:
        abort(404)
    schema = SiteSchema()
    return schema.jsonify(site)

@bp.route('/sites-simple-centroides', methods=['GET'])
def get_sites_simple_centroid():
    sites = (
        Site.query
        .options(
            load_only(
                Site.id_site, Site.nom, Site.slug, Site.type_rn, Site.code, Site.region, Site.creation_geol, Site.geom_point
            ),  # Charger uniquement les champs nécessaires
            joinedload(Site.sites_inpg).joinedload(CorSiteInpg.inpg).load_only(
                Inpg.id_metier, Inpg.lb_site, Inpg.niveau_de_diffusion, Inpg.nombre_etoiles
            ),  # Charger les sites_inpg et inpg en une seule requête
            joinedload(Site.patrimoines_geologiques).load_only(PatrimoineGeologiqueGestionnaire.lb),
            joinedload(Site.stratotypes).load_only(Stratotype.libelle),
        )
        .filter(Site.perimetre_protection != True)
        .order_by(Site.nom)
        .all()
    )

    schema = SiteSchemaSimple(
        only=('id_site', 'nom', 'slug', 'type_rn', 'code', 'region', 'creation_geol', 'geom_point', 'sites_inpg', 'patrimoines_geologiques', 'stratotypes'),
        many=True
    )
    return schema.jsonify(sites)

@bp.route('/sites-dans-bbox', methods=['GET'])
def get_sites_in_bbox():
    # Récupère les coordonnées de la BBOX (bounding box) depuis les paramètres de requête
    bbox = request.args.get('bbox')  # bbox peut être "xmin,ymin,xmax,ymax"
    xmin, ymin, xmax, ymax = map(float, bbox.split(','))

    # Utilisation des fonctions PostGIS avec SQLAlchemy
    sites = Site.query.filter(
        func.ST_Intersects(
            Site.geom,
            func.ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326)  # Remplacez 4326 par votre SRID
        )
    ).all()
    schema = SiteSchemaSimple(only=('id_site','geom', 'nom','slug', 'sites_inpg','patrimoines_geologiques','creation_geol'),many=True)
    return schema.jsonify(sites)

@bp.route('/sites-pour-admin', methods=['GET'])
def get_sites_pour_admin():
    # Récupérer les sites avec les champs souhaités
    sites = (
        Site.query
        .options(load_only(Site.id_site, Site.nom, Site.slug, Site.code))
        .filter(Site.perimetre_protection != True)
        .order_by(Site.nom)
        .all()
    )

    # Instance du schéma pour sérialiser les objets modifications si besoin,
    # sinon on travaille directement avec le dump en dict.
    result = []
    for site in sites:
        modifications = (
            SuivisModifs.query
            .filter(SuivisModifs.id_site == site.id_site)
            .order_by(SuivisModifs.date_update.desc())
            .limit(5)
            .all()
        )
        # Sérialisation avec votre schéma (en assumant que SuivisModifsSchema.dump retourne un dict)
        modifications_data = SuivisModifsSchema(many=True).dump(modifications)
        # Transformation des modifications pour obtenir le format désiré
        modifications_formattees = transform_modifications(modifications_data)
        
        result.append({
            "id_site": site.id_site,
            "nom": site.nom,
            "slug": site.slug,
            "code": site.code,
            "completion": site.infos_base.completion if site.infos_base else None,
            "modifications": modifications_formattees
        })

    return jsonify(result)


def format_value(val):
    """Transforme la valeur en libellé humain."""
    if val is None:
        return "Non renseigné"
    if isinstance(val, str):
        if val.lower() == "t":
            return "Oui"
        if val.lower() == "f":
            return "Non"
    return val

def transform_modifications(modifications):
    """Transforme la liste des modifications pour obtenir le format désiré."""
    # Dictionnaire de correspondance : clé de modification -> libellé affiché
    mapping_labels = {
        "contains_paleontological_heritage" : "Présence de patrimoine paléontologique",
        "contains_paleontological_heritage_vertebrates": "Présence de patrimoine paléontologique - Vertébrés",
        "contains_paleontological_heritage_invertebrates": "Présence de patrimoine paléontologique - Invertébrés",
        "contains_paleontological_heritage_plants": "Présence de patrimoine paléontologique - Végétaux",
        "contains_paleontological_heritage_trace_fossils": "Présence de patrimoine paléontologique - Traces fossiles",
        "contains_paleontological_heritage_other_details": "Autre patrimoine paléontologique",
        "reserve_has_geological_collections": "Possession de collections géologiques propres",
        "reserve_has_exhibition": "Présence de lieu d'exposition",
        "geological_units_other": "Autre ensemble géologique",
        "subterranean_habitats_natural_cavities": "Présence de cavités naturelles",
        "subterranean_habitats_anthropogenic_cavities": "Présence de cavités anthropiques",
        "associated_with_mineral_resources": "Présence d'exploitation de ressource minérales",
        "mineral_resources_old_quarry": "Présence d'anciennes carrières",
        "mineral_resources_active_quarry": "Présence de carrières en activité",
        "mineral_resources_old_mine": "Présence d'ancienne mine",
        "mineral_resources_active_mine": "Présence de mine en activité",
        "reserve_has_geological_site_for_visitors": "Présence de sites pour visiteurs",
        "nb_sites_for_visitors": "Nombre de sites pour visiteurs",
        "site_for_visitors_free_access": "Sites en accès libre",
        "offers_geodiversity_activities": "Présence d'animations sur le géodiversité"
    }

    formatted_modifications = []
    for mod in modifications:
        # Récupérer les dictionnaires 'ancien' et 'nouveau'
        ancien = mod.get("ancien", {})
        nouveau = mod.get("nouveau", {})

        # On considère l'ensemble des clés modifiées
        keys_modifiees = set(ancien.keys()).union(nouveau.keys())
        changements = []
        for key in keys_modifiees:
            if key not in mapping_labels:
                continue
            # On récupère le libellé à afficher
            label = mapping_labels.get(key, key)
            # Formatage des valeurs en utilisant la fonction helper
            old_val = format_value(ancien.get(key))
            new_val = format_value(nouveau.get(key))
            changements.append(f'{label} : de "{old_val}" à "{new_val}"')
        
        formatted_modifications.append({
            "date_update": mod.get("date_update"),
            "user_update": mod.get("user_update"),
            "changements": changements
        })

    return formatted_modifications

@bp.route('/t_infos_base_site/<slug>', methods=['PUT'])
def update_t_infos_base_site(slug):
    try:
        data = request.get_json()
        site = Site.query.filter_by(slug=slug).first()
        if not site:
            return jsonify({'message': 'Site non trouvé'}), 404

        # Mise à jour des champs
        site.creation_geol = data.get('reserve_created_on_geological_basis')
        contains_paleontological_heritage = data.get('contains_paleontological_heritage', {})
        site.infos_base.contains_paleontological_heritage = contains_paleontological_heritage.get('answer', site.infos_base.contains_paleontological_heritage)
        site.infos_base.contains_paleontological_heritage_vertebrates = contains_paleontological_heritage.get('vertebrates', site.infos_base.contains_paleontological_heritage_vertebrates)
        site.infos_base.contains_paleontological_heritage_invertebrates = contains_paleontological_heritage.get('invertebrates', site.infos_base.contains_paleontological_heritage_invertebrates)
        site.infos_base.contains_paleontological_heritage_plants = contains_paleontological_heritage.get('plants', site.infos_base.contains_paleontological_heritage_plants)
        site.infos_base.contains_paleontological_heritage_trace_fossils = contains_paleontological_heritage.get('traceFossils', site.infos_base.contains_paleontological_heritage_trace_fossils)
        site.infos_base.contains_paleontological_heritage_other_details = contains_paleontological_heritage.get('otherDetails', site.infos_base.contains_paleontological_heritage_other_details)
        site.infos_base.reserve_has_geological_collections = data.get('reserve_has_geological_collections', site.infos_base.reserve_has_geological_collections)
        site.infos_base.reserve_has_exhibition = data.get('reserve_has_exhibition', site.infos_base.reserve_has_exhibition)
        site.infos_base.contains_subterranean_habitats = data.get('contains_subterranean_habitats', site.infos_base.contains_subterranean_habitats)
        site.infos_base.subterranean_habitats_natural_cavities = data.get('subterranean_habitats_natural_cavities', site.infos_base.subterranean_habitats_natural_cavities)
        site.infos_base.subterranean_habitats_anthropogenic_cavities = data.get('subterranean_habitats_anthropogenic_cavities', site.infos_base.subterranean_habitats_anthropogenic_cavities)
        site.infos_base.associated_with_mineral_resources = data.get('associated_with_mineral_resources', site.infos_base.associated_with_mineral_resources)
        site.infos_base.mineral_resources_old_quarry = data.get('mineral_resources_old_quarry', site.infos_base.mineral_resources_old_quarry)
        site.infos_base.mineral_resources_active_quarry = data.get('mineral_resources_active_quarry', site.infos_base.mineral_resources_active_quarry)
        site.infos_base.quarry_extracted_material = data.get('quarry_extracted_material', site.infos_base.quarry_extracted_material)
        site.infos_base.quarry_fossiliferous_material = data.get('quarry_fossiliferous_material', site.infos_base.quarry_fossiliferous_material)
        site.infos_base.mineral_resources_old_mine = data.get('mineral_resources_old_mine', site.infos_base.mineral_resources_old_mine)
        site.infos_base.mineral_resources_active_mine = data.get('mineral_resources_active_mine', site.infos_base.mineral_resources_active_mine)
        site.infos_base.mine_extracted_material = data.get('mine_extracted_material', site.infos_base.mine_extracted_material)
        site.infos_base.mine_fossiliferous_material = data.get('mine_fossiliferous_material', site.infos_base.mine_fossiliferous_material)
        site.infos_base.reserve_has_geological_site_for_visitors = data.get('reserve_has_geological_site_for_visitors', site.infos_base.reserve_has_geological_site_for_visitors)
        site.infos_base.nb_sites_for_visitors = data.get('nb_sites_for_visitors', site.infos_base.nb_sites_for_visitors)
        site.infos_base.site_for_visitors_free_access = data.get('site_for_visitors_free_access', site.infos_base.site_for_visitors_free_access)
        site.infos_base.offers_geodiversity_activities = data.get('offers_geodiversity_activities', site.infos_base.offers_geodiversity_activities)
        site.infos_base.geological_units = data.get('geologicalUnits', site.infos_base.geological_units)
        site.infos_base.geological_units_other = data.get('geologicalUnitsOtherText', site.infos_base.geological_units_other)
        site.infos_base.biblio = data.get('biblio', site.infos_base.biblio)
        site.infos_base.user_update = data.get('user_update')
        site.infos_base.date_update = datetime.datetime.now()

        if 'stratotypesLimite' in data or 'stratotypesEtage' in data:
            # Fusionner les IDs des deux listes
            stratotype_ids = set(data.get('stratotypesLimite', []) + data.get('stratotypesEtage', []))

            # Récupérer les stratotypes actuels liés au site
            current_stratotypes = {stratotype.id_stratotype for stratotype in site.stratotypes}

            # Déterminer les stratotypes à ajouter
            to_add = stratotype_ids - current_stratotypes

            # Déterminer les stratotypes à supprimer
            to_remove = current_stratotypes - stratotype_ids

            # Ajouter les nouveaux stratotypes
            for stratotype_id in to_add:
                stratotype = Stratotype.query.get(stratotype_id)
                if stratotype:
                    site.stratotypes.append(stratotype)

            # Supprimer les stratotypes qui ne sont plus présents
            for stratotype_id in to_remove:
                stratotype = next(
                    (s for s in site.stratotypes if s.id_stratotype == stratotype_id),
                    None
                )
                if stratotype:
                    site.stratotypes.remove(stratotype)


        # Mise à jour des patrimoines géologiques principal
        if 'geologicalHeritages' in data and data['geologicalHeritages'] is not None:
            # Récupérer tous les éléments existants pour le site
            existing_heritages = PatrimoineGeologiqueGestionnaire.query.filter_by(id_site=site.id_site).all()
            
            # Créer un ensemble des identifiants 'lb' dans les données fournies
            provided_lb_set = {heritage_data['lb'] for heritage_data in data['geologicalHeritages']}
            
            # Supprimer les éléments qui ne sont pas dans les données fournies
            for heritage in existing_heritages:
                if heritage.lb not in provided_lb_set:
                    db.session.delete(heritage)

            # Ajouter ou mettre à jour les éléments existants
            for heritage_data in data['geologicalHeritages']:
                heritage = PatrimoineGeologiqueGestionnaire.query.filter_by(id_site=site.id_site, lb=heritage_data['lb']).first()
                if not heritage:
                    heritage = PatrimoineGeologiqueGestionnaire(
                        id_site=site.id_site,
                        lb=heritage_data['lb'],
                        interet_geol_principal=heritage_data['interet_geol_principal'],
                        age_des_terrains_le_plus_recent=heritage_data['age_des_terrains_le_plus_recent'],
                        age_des_terrains_le_plus_ancien=heritage_data['age_des_terrains_le_plus_ancien'],
                        bibliographie=heritage_data.get('bibliographie', '')
                    )
                    db.session.add(heritage)
                else:
                    heritage.interet_geol_principal = heritage_data['interet_geol_principal']
                    heritage.age_des_terrains_le_plus_recent = heritage_data['age_des_terrains_le_plus_recent']
                    heritage.age_des_terrains_le_plus_ancien = heritage_data['age_des_terrains_le_plus_ancien']
                    heritage.bibliographie = heritage_data.get('bibliographie', '')


        # Mise à jour des patrimoines géologiques de protection
        if site.id_perimetre_protection is not None and 'protection_geologicalHeritages' in data and data['protection_geologicalHeritages'] is not None:
            # Récupérer tous les patrimoines géologiques existants pour le périmètre de protection du site
            existing_heritages = PatrimoineGeologiqueGestionnaire.query.filter_by(id_site=site.id_perimetre_protection).all()
            
            # Créer un ensemble des identifiants 'lb' dans les données fournies
            provided_lb_set = {heritage_data['lb'] for heritage_data in data['protection_geologicalHeritages']}
            
            # Supprimer les patrimoines qui ne sont plus présents dans les données fournies
            for heritage in existing_heritages:
                if heritage.lb not in provided_lb_set:
                    db.session.delete(heritage)
            
            # Ajouter ou mettre à jour les patrimoines existants
            for heritage_data in data['protection_geologicalHeritages']:
                heritage = PatrimoineGeologiqueGestionnaire.query.filter_by(
                    id_site=site.id_perimetre_protection, 
                    lb=heritage_data['lb']
                ).first()
                if not heritage:
                    heritage = PatrimoineGeologiqueGestionnaire(
                        id_site=site.id_perimetre_protection,
                        lb=heritage_data['lb'],
                        interet_geol_principal=heritage_data['interet_geol_principal'],
                        age_des_terrains_le_plus_recent=heritage_data['age_des_terrains_le_plus_recent'],
                        age_des_terrains_le_plus_ancien=heritage_data['age_des_terrains_le_plus_ancien'],
                        bibliographie=heritage_data.get('bibliographie', '')
                    )
                    db.session.add(heritage)
                else:
                    heritage.interet_geol_principal = heritage_data['interet_geol_principal']
                    heritage.age_des_terrains_le_plus_recent = heritage_data['age_des_terrains_le_plus_recent']
                    heritage.age_des_terrains_le_plus_ancien = heritage_data['age_des_terrains_le_plus_ancien']
                    heritage.bibliographie = heritage_data.get('bibliographie', '')

        if 'quarry_extracted_materials' in data and data['quarry_extracted_materials'] is not None:
            existing_substances = {substance.substance_id: substance for substance in site.substances}  # Récupère les substances existantes liées au site
            received_substances = {item['substance']: item['fossiliferous'] for item in data['quarry_extracted_materials']}

            # Ajout ou mise à jour des substances reçues
            for substance_id, fossiliferous in received_substances.items():
                if substance_id in existing_substances:
                    # Met à jour la valeur fossilifère si elle diffère
                    if existing_substances[substance_id].fossilifere != fossiliferous:
                        existing_substances[substance_id].fossilifere = fossiliferous
                else:
                    # Ajoute une nouvelle substance si elle n'existe pas encore
                    new_substance = CorSiteSubstance(
                        site_id=site.id_site,
                        substance_id=substance_id,
                        fossilifere=fossiliferous
                    )
                    db.session.add(new_substance)

    # Suppression des substances qui ne sont plus dans les données reçues
            for substance_id, existing_substance in existing_substances.items():
                if substance_id not in received_substances:
                    db.session.delete(existing_substance)

        db.session.commit()
        return jsonify({'type': 'success', 'msg': 'Informations géologiques de la réserve mises à jour avec succès !'})

    except Exception as e:
        print(f"Error: {str(e)}")  # Debugging log
        response = jsonify(
            type='bug',
            msg='Erreur lors de la mise à jour de TInfosBaseSite en BDD',
            flask_message=str(e)
        )
        response.status_code = 500
        return response

@bp.route('/invalid-inpg-from-site', methods=['PUT'])
def update_inpg_site():
    data = request.get_json()
    print(data.get('reason'))
    try :
        inpg = db.session.query(CorSiteInpg).filter_by(inpg_id=data.get('inpgId'), site_id=data.get('siteId')).first()

        print(inpg)

        inpg.active = False
        inpg.raison_desactive = data.get('reason')

        db.session.commit()

        return jsonify({'type': 'success', 'msg': 'Les site INPG a été invalidé !'})
    
    except Exception as e:
        print(e)
        response = jsonify(
            type='bug',
            msg='Erreur lors de l\'invalidation du site INPG',
            flask_message=str(e)
        )
        response.status_code = 500
        return response

@bp.route('/revalid-inpg-from-site', methods=['PUT'])
def update_inpg_site_site():
    data = request.get_json()
    print(data.get('reason'))
    try :
        inpg = db.session.query(CorSiteInpg).filter_by(inpg_id=data.get('inpgId'), site_id=data.get('siteId')).first()

        inpg.active = True

        db.session.commit()

        return jsonify({'type': 'success', 'msg': 'Les site INPG a été revalidé !'})
    
    except Exception as e:
        print(e)
        response = jsonify(
            type='bug',
            msg='Erreur lors de la revalidation du site INPG',
            flask_message=str(e)
        )
        response.status_code = 500
        return response
  
@bp.route('/nomenclatures/<id_type>', methods=['GET'])
def get_nomenclatures_by_type(id_type):
    nomenclatures = BibNomenclatureType.query.filter_by(id_type=id_type).first()
    schema = NomenclatureTypeSchema(many=False)
    Obj = schema.dump(nomenclatures)

    return jsonify(Obj)
  
@bp.route('/stratotypes-etage', methods=['GET'])
def get_stratotypes_etage():

    stratotypes = Stratotype.query.filter(Stratotype.type == 'etage').order_by(Stratotype.libelle).all()  # Renvoie les sites filtrés par type_rn et/ou code
    schema = StratotypeSchema(many=True)
    return schema.jsonify(stratotypes)

@bp.route('/stratotypes-limite', methods=['GET'])
def get_stratotypes_limite():

    stratotypes = Stratotype.query.filter(Stratotype.type == 'limite').order_by(Stratotype.libelle).all()  # Renvoie les sites filtrés par type_rn et/ou code
    schema = StratotypeSchema(many=True)
    return schema.jsonify(stratotypes)

@bp.route('/parametre/<libelle>', methods=['GET'])
def get_parametre_by_libelle(libelle):

    parametre = Parametres.query.filter(Parametres.libelle == libelle).first()
    schema = ParametresSchema(many=False)
    return schema.jsonify(parametre)

@bp.route('/contact', methods=['POST'])
def send_contact_mail():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Données invalides"}), 400

    sujet = data.get('sujet', '').lower()
    nom = data.get('nom', '')
    email = data.get('email', '')
    message_content = data.get('message', '')

    # Déterminez le destinataire selon le sujet
    if sujet == 'technique':
        recipient = current_app.config.get('MAIL_DEST_TECHNIQUE')
    else:
        recipient = current_app.config.get('MAIL_DEST_GEOL')

    # Préparez le message
    msg = Message(subject=f"Mail depuis SOCLE",
                  sender=current_app.config.get('MAIL_DEFAULT_SENDER'),
                  recipients=[recipient])
    msg.body = f"Nom: {nom}\nEmail: {email}\n\nMessage:\n{message_content}"
    try:
        mail.send(msg)
        return jsonify({"msg": "Mail envoyé avec succès"}), 200
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'envoi du mail: {e}")
        return jsonify({"msg": "Erreur lors de l'envoi du mail"}), 500