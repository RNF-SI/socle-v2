import site
from venv import logger
from flask import Flask, request, Response, render_template, redirect, Blueprint, jsonify, g, abort
import requests
import json
from app import app, db
from models import PatrimoineGeologiqueGestionnaire, Site, EntiteGeol, TInfosBaseSite, Nomenclature, BibNomenclatureType,Inpg, Site, CorSiteInpg, CorSiteSubstance, Stratotype, Parametres
from schemas import PatrimoineGeologiqueGestionnaireSchema, PerimetreProtectionSchema, TInfosBaseSiteSchema, SiteSchema, NomenclatureSchema, NomenclatureTypeSchema, SiteSchemaSimple, StratotypeSchema, ParametresSchema
from pypnusershub import routes as fnauth
import logging
from sqlalchemy import func
from sqlalchemy.orm import joinedload, load_only

bp = Blueprint('routes', __name__)

logging.basicConfig(level=logging.DEBUG)

# @bp.route('/sites', methods=['GET'])
# def getSites():
#     sites = Site.query.all()
#     schema = SiteSchema(many=True)
#     siteObj = schema.dump(sites)
#     return jsonify(siteObj)

@bp.route('/site/<slug>', methods=['GET'])
def getSiteBySlug(slug):
    print(f"Fetching details for slug: {slug}")  # Ajoutez ce log
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

@bp.route('/site', methods=['POST'])
def add_site():
    data = request.get_json()
    name = data['name']
    slug = generate_slug(name)
    site = Site(name=name, slug=slug)
    db.session.add(site)
    try:
        db.session.commit()
        schema = SiteSchema()
        return schema.jsonify(site), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Site name already exists'}), 400

@bp.route('/sites/<int:id>', methods=['PUT'])
def update_site(id):
    data = request.json
    site = Site.query.get(id)
    if site is None:
        abort(404)
    
    site.nom = data.get('nom', site.nom)
    site.slug = generate_slug(site.nom)
    # autres champs...
    
    db.session.commit()
    return jsonify(site.to_dict())

@bp.route('/site/<slug>', methods=['GET'])
def get_centroids():
    try:
        # Utilisation de ST_AsGeoJSON pour convertir les objets WKBElement en GeoJSON
        centroids = Site.query.with_entities(func.ST_AsGeoJSON(Site.geom_point)).filter(Site.geom_point.isnot(None)).all()

        # Extraire les données GeoJSON
        result = [{"centroid": centroid[0]} for centroid in centroids if centroid[0] is not None]
        
        return jsonify(result)
    except Exception as e:
        print(f"Erreur lors de la récupération des centroïdes : {e}")
        abort(500)

@bp.route('/sites/count', methods=['GET'])
def get_site_count():
    # Compter uniquement les sites sans périmètre de protection
    total_sites_without_protection = Site.query.filter(Site.perimetre_protection == False).count()
    return jsonify({'total_sites': total_sites_without_protection})

 

@bp.route('/sites', methods=['GET'])
def get_sites_by_type_rn_and_code():
    type_rn = request.args.get('type_rn')  # Récupère le type de RN depuis la requête
    code = request.args.get('code')  # Récupère le code depuis la requête

    query = Site.query.filter(Site.type_rn != 'PP')
    if type_rn:
        query = query.filter_by(type_rn=type_rn)
    if code:
        query = query.filter_by(code=code)

    sites = query.all()  # Renvoie les sites filtrés par type_rn et/ou code
    schema = SiteSchema(many=True)
    return schema.jsonify(sites)

@bp.route('/sites-simple', methods=['GET'])
def get_sites_simple():

    sites = Site.query.filter(Site.type_rn != 'PP').all()  # Renvoie les sites filtrés par type_rn et/ou code
    schema = SiteSchemaSimple(many=True)
    return schema.jsonify(sites)

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


# @bp.route('/sites/patrimoine', methods=['GET'])
# def get_sites_patrimoine():
#     patrimoine_filter = request.args.get('patrimoine', 'all')

#     if patrimoine_filter == 'oui':
#         # Récupérer les sites qui ont un patrimoine géologique
#         sites_with_patrimoine = db.session.query(Site, db.func.array_agg(Inpg.id_metier)).join(PatrimoineGeologiqueGestionnaire, Site.id_site == PatrimoineGeologiqueGestionnaire.id_site)\
#             .outerjoin(cor_site_inpg, Site.id_site == cor_site_inpg.c.site_id)\
#             .outerjoin(Inpg, cor_site_inpg.c.inpg_id == Inpg.id_inpg)\
#             .group_by(Site.id_site).all()
#     elif patrimoine_filter == 'non':
#         # Récupérer les sites qui n'ont pas de patrimoine géologique
#         sites_without_patrimoine = db.session.query(Site, db.func.array_agg(Inpg.id_metier)).outerjoin(PatrimoineGeologiqueGestionnaire).filter(PatrimoineGeologiqueGestionnaire.id_site == None)\
#             .outerjoin(cor_site_inpg, Site.id_site == cor_site_inpg.c.site_id)\
#             .outerjoin(Inpg, cor_site_inpg.c.inpg_id == Inpg.id_inpg)\
#             .group_by(Site.id_site).all()
#         sites_with_patrimoine = sites_without_patrimoine
#     else:
#         # Récupérer tous les sites
#         sites_with_patrimoine = db.session.query(Site, db.func.array_agg(Inpg.id_metier)).outerjoin(cor_site_inpg, Site.id_site == cor_site_inpg.c.site_id)\
#             .outerjoin(Inpg, cor_site_inpg.c.inpg_id == Inpg.id_inpg)\
#             .group_by(Site.id_site).all()

#     # Serializer et retourner la réponse
#     result = []
#     site_schema = SiteSchema(many=False)
#     for site, id_metiers in sites_with_patrimoine:
#         site_data = site_schema.dump(site)
#         site_data['id_metier'] = ', '.join([str(metier) for metier in id_metiers])  # Concaténer les id_metier
#         result.append(site_data)

#     return jsonify(result)


# Flask route update
# @bp.route('/sites/inpg', methods=['GET'])
# def get_sites_with_inpg():
#     # Requête qui retourne un site et tous ses id_metier associés
#     sites = db.session.query(Site, db.func.array_agg(Inpg.id_metier), db.func.array_agg(Inpg.url)).outerjoin(cor_site_inpg, Site.id_site == cor_site_inpg.c.site_id)\
#         .outerjoin(Inpg, cor_site_inpg.c.inpg_id == Inpg.id_inpg).group_by(Site.id_site).all()

#     site_schema = SiteSchema(many=False)
#     result = []
#     for site, id_metiers, urls in sites:
#         site_data = site_schema.dump(site)  # Sérialiser uniquement le site
#         site_data['id_metier'] = [{'id': metier, 'url': url} for metier, url in zip(id_metiers, urls)]  # Associer chaque `id_metier` à son `url`
#         result.append(site_data)

#     return jsonify(result)



@bp.route('/sites/region', methods=['GET'])
def get_sites_by_region():
    region_filter = request.args.get('region', 'all')

    if region_filter != 'all':
        # Récupérer les sites qui appartiennent à la région sélectionnée
        sites_by_region = Site.query.filter(Site.region == region_filter).all()
    else:
        # Récupérer tous les sites
        sites_by_region = Site.query.all()

    # Serializer et retourner la réponse
    site_schema = SiteSchema(many=True)
    return jsonify(site_schema.dump(sites_by_region))



@bp.route('/t_infos_base_site', methods=['POST'])
def submitData():
    data = request.get_json()
    print(data)
    if not data or 'id_site' not in data:
        return jsonify({'type': 'error', 'msg': 'No data provided or id_site is missing'}), 400
    try:
        t_infos_base_site = TInfosBaseSite(
            # id_site=data.get('id_site'),
            reserve_created_on_geological_basis=data.get('reserve_created_on_geological_basis'),
            reserve_contains_geological_heritage_inpg=data.get('reserve_contains_geological_heritage_inpg'),
            reserve_contains_geological_heritage_other=data.get('reserve_contains_geological_heritage_other'),
            protection_perimeter_contains_geological_heritage_inpg=data.get('protection_perimeter_contains_geological_heritage_inpg'),
            protection_perimeter_contains_geological_heritage_other=data.get('protection_perimeter_contains_geological_heritage_other'),
            main_geological_interests_stratigraphic=data.get('main_geological_interests_stratigraphic'),
            main_geological_interests_paleontological=data.get('main_geological_interests_paleontological'),
            main_geological_interests_sedimentological=data.get('main_geological_interests_sedimentological'),
            main_geological_interests_geomorphological=data.get('main_geological_interests_geomorphological'),
            main_geological_interests_mineral_resource=data.get('main_geological_interests_mineral_resource'),
            main_geological_interests_mineralogical=data.get('main_geological_interests_mineralogical'),
            main_geological_interests_metamorphism=data.get('main_geological_interests_metamorphism'),
            main_geological_interests_volcanism=data.get('main_geological_interests_volcanism'),
            main_geological_interests_plutonism=data.get('main_geological_interests_plutonism'),
            main_geological_interests_hydrogeology=data.get('main_geological_interests_hydrogeology'),
            main_geological_interests_tectonics=data.get('main_geological_interests_tectonics'),
            contains_paleontological_heritage=data.get('contains_paleontological_heritage'),
            contains_paleontological_heritage_vertebrates=data.get('contains_paleontological_heritage_vertebrates'),
            contains_paleontological_heritage_invertebrates=data.get('contains_paleontological_heritage_invertebrates'),
            contains_paleontological_heritage_plants=data.get('contains_paleontological_heritage_plants'),
            contains_paleontological_heritage_trace_fossils=data.get('contains_paleontological_heritage_trace_fossils'),
            contains_paleontological_heritage_other=data.get('contains_paleontological_heritage_other'),
            #contains_paleontological_heritage_other_details=data.get('contains_paleontological_heritage_other_details'),
            reserve_has_geological_collections=data.get('reserve_has_geological_collections'),
            reserve_has_exhibition=data.get('reserve_has_exhibition'),
            #geological_age=data.get('geological_age'),
            reserve_contains_stratotype=data.get('reserve_contains_stratotype'),
            stratotype_details=data.get('stratotype_details'),
            contains_subterranean_habitats=data.get('contains_subterranean_habitats'),
            subterranean_habitats_natural_cavities=data.get('subterranean_habitats_natural_cavities'),
            subterranean_habitats_anthropogenic_cavities=data.get('subterranean_habitats_anthropogenic_cavities'),
            associated_with_mineral_resources=data.get('associated_with_mineral_resources'),
            mineral_resources_old_quarry=data.get('mineral_resources_old_quarry'),
            mineral_resources_active_quarry=data.get('mineral_resources_active_quarry'),
            quarry_extracted_material=data.get('quarry_extracted_material'),
            quarry_fossiliferous_material=data.get('quarry_fossiliferous_material'),
            mineral_resources_old_mine=data.get('mineral_resources_old_mine'),
            mineral_resources_active_mine=data.get('mineral_resources_active_mine'),
            mine_extracted_material=data.get('mine_extracted_material'),
            mine_fossiliferous_material=data.get('mine_fossiliferous_material'),
            reserve_has_geological_site_for_visitors=data.get('reserve_has_geological_site_for_visitors'),
            site_for_visitors_free_access=data.get('site_for_visitors_free_access'),
            offers_geodiversity_activities=data.get('offers_geodiversity_activities')
        )

        db.session.add(t_infos_base_site)
        db.session.commit()

        return jsonify({'type': 'success', 'msg': 'TInfosBaseSite mise à jour ou ajoutée avec succès !'})

    except Exception as e:
        db.session.rollback()
        response = jsonify(
            type='bug',
            msg="Erreur lors de l'ajout ou mise à jour de TInfosBaseSite en BDD",
            flask_message=str(e)
        )
        response.status_code = 500
        return response
    
@app.route('/t_infos_base_sites', methods=['GET'])
def get_all_t_infos_base_sites():
    t_infos_base_sites = TInfosBaseSite.query.all()
    return TInfosBaseSiteSchema().jsonify(t_infos_base_sites)

@app.route('/t_infos_base_site/<string:slug>', methods=['GET'])
def get_t_infos_base_site_by_slug(slug):
    t_infos_base_site = TInfosBaseSite.query.filter_by(slug=slug).first()
    if t_infos_base_site:
        return TInfosBaseSiteSchema().jsonify(t_infos_base_site)
    else:
        return jsonify({'error': 'Site not found'}), 404


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
        # site.infos_base.contains_paleontological_heritage = contains_paleontological_heritage.get('answer', site.infos_base.contains_paleontological_heritage)
        site.infos_base.contains_paleontological_heritage_vertebrates = contains_paleontological_heritage.get('vertebrates', site.infos_base.contains_paleontological_heritage_vertebrates)
        site.infos_base.contains_paleontological_heritage_invertebrates = contains_paleontological_heritage.get('invertebrates', site.infos_base.contains_paleontological_heritage_invertebrates)
        site.infos_base.contains_paleontological_heritage_plants = contains_paleontological_heritage.get('plants', site.infos_base.contains_paleontological_heritage_plants)
        site.infos_base.contains_paleontological_heritage_trace_fossils = contains_paleontological_heritage.get('traceFossils', site.infos_base.contains_paleontological_heritage_trace_fossils)
        # site.infos_base.contains_paleontological_heritage_other = contains_paleontological_heritage.get('other', site.infos_base.contains_paleontological_heritage_other)
        site.infos_base.contains_paleontological_heritage_other_details = contains_paleontological_heritage.get('otherDetails', site.infos_base.contains_paleontological_heritage_other_details)

        site.infos_base.reserve_has_geological_collections = data.get('reserve_has_geological_collections', site.infos_base.reserve_has_geological_collections)
        site.infos_base.reserve_has_exhibition = data.get('reserve_has_exhibition', site.infos_base.reserve_has_exhibition)
        # site.infos_base.reserve_contains_stratotype = data.get('reserve_contains_stratotype', site.infos_base.reserve_contains_stratotype)
        # site.infos_base.stratotype_limit = data.get('stratotype_limit', site.infos_base.stratotype_limit)
        # site.infos_base.stratotype_limit_input = data.get('stratotype_limit_input', site.infos_base.stratotype_limit_input)
        # site.infos_base.stratotype_stage = data.get('stratotype_stage', site.infos_base.stratotype_stage)
        # site.infos_base.stratotype_stage_input = data.get('stratotype_stage_input', site.infos_base.stratotype_stage_input)
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
        site.infos_base.site_for_visitors_free_access = data.get('site_for_visitors_free_access', site.infos_base.site_for_visitors_free_access)
        site.infos_base.offers_geodiversity_activities = data.get('offers_geodiversity_activities', site.infos_base.offers_geodiversity_activities)
        site.infos_base.geological_units = data.get('geologicalUnits', site.infos_base.geological_units)
        site.infos_base.geological_units_other = data.get('geologicalUnitsOtherText', site.infos_base.geological_units_other)
        # nouveaux_ages_dict = []
        # if 'eres' in data and data['eres'] is not None:
        #     for age in data['eres']:
        #         nomenclature = Nomenclature.query.filter_by(id_nomenclature=age).first()
        #         if nomenclature not in site.ages:
        #             site.ages.append(nomenclature)
        #         nouveaux_ages_dict.append(nomenclature)
        # for age in site.ages:
        #     if age not in nouveaux_ages_dict:
        #         site.ages.remove(age)

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
        return jsonify({'type': 'success', 'msg': 'TInfosBaseSite mise à jour avec succès !'})

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

@bp.route('/stratotypes/count', methods=['GET'])
def get_stratotype_count():
    try:
        # Compte le nombre de lignes où `reserve_contains_stratotype` est vrai
        stratotype_count = db.session.query(TInfosBaseSite).filter_by(reserve_contains_stratotype=True).count()
        return jsonify({'total_stratotypes': stratotype_count}), 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Erreur lors de la récupération du nombre de stratotypes', 'error': str(e)}), 500

@bp.route('/sites/inpg/count', methods=['GET'])
def get_inpg_site_count():
    try:
        # Compter le nombre de sites qui ont au moins une entrée INPG associée
        inpg_site_count = db.session.query(Site).join(Site.inpg).distinct().count()
        return jsonify({'total_inpg_sites': inpg_site_count}), 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Erreur lors de la récupération du nombre de sites INPG', 'error': str(e)}), 500

  
@bp.route('/nomenclatures/<id_type>', methods=['GET'])
def get_nomenclatures_by_type(id_type):
    nomenclatures = BibNomenclatureType.query.filter_by(id_type=id_type).first()
    schema = NomenclatureTypeSchema(many=False)
    Obj = schema.dump(nomenclatures)

    return jsonify(Obj)
  
### 
@bp.route('/patrimoine_geologique/<int:id_site>', methods=['GET'])
def get_patrimoine_geologique(id_site):
    logging.info(f"Received request for patrimoine geologique with id_site: {id_site}")
    try:
        # Récupérer le site principal
        site_principal = Site.query.get(id_site)
        if not site_principal:
            logging.warning(f"Site principal with id {id_site} not found")
            return jsonify({'message': 'Site principal non trouvé'}), 404

        logging.debug(f"Site principal found: {site_principal}")

        # Récupérer les patrimoines géologiques pour le site principal
        patrimoines_geologiques_principal = PatrimoineGeologiqueGestionnaire.query.filter_by(id_site=id_site).all()
        logging.debug(f"Found {len(patrimoines_geologiques_principal)} patrimoines geologiques for site principal")

        patrimoines_geologiques_protection = []

        # Récupérer les patrimoines géologiques pour le périmètre de protection s'il existe
        if not site_principal.perimetre_protection:
            logging.debug(f"Site principal has perimetre protection with ID: {site_principal.id_perimetre_protection}")
            site_protection = Site.query.get(site_principal.id_perimetre_protection)
            if site_protection:
                logging.debug(f"Site protection found: {site_protection}")
                patrimoines_geologiques_protection = PatrimoineGeologiqueGestionnaire.query.filter_by(id_site=site_protection.id_site).all()
                logging.debug(f"Found {len(patrimoines_geologiques_protection)} patrimoines geologiques for site protection")
            else:
                logging.warning(f"Site protection with id {site_principal.id_perimetre_protection} not found")
        else:
            logging.debug("Site principal does not have perimetre protection")

        if not patrimoines_geologiques_principal and not patrimoines_geologiques_protection:
            logging.warning(f"No patrimoine geologique found for site with id {id_site}")
            return jsonify({'message': 'Aucun patrimoine géologique trouvé pour ce site'}), 404

        schema = PatrimoineGeologiqueGestionnaireSchema(many=True)
        response_data = {
            'principal': schema.dump(patrimoines_geologiques_principal),
            'protection': schema.dump(patrimoines_geologiques_protection)
        }

        logging.info(f"Returning patrimoine geologique data for site with id {id_site}")
        return jsonify(response_data)
    except Exception as e:
        logging.error(f"Error occurred: {str(e)}", exc_info=True)  # Debugging log with stack trace
        response = jsonify(
            type='bug',
            msg='Erreur lors de la récupération du patrimoine géologique',
            flask_message=str(e)
        )
        response.status_code = 500
        return response
@bp.route('/sites/protection', methods=['GET'])
def get_sites_with_protection():
    sites = Site.query.filter(Site.perimetre_protection == True).all()
    schema = PerimetreProtectionSchema(many=True)
    site_obj = schema.dump(sites)
    return jsonify(site_obj)


@bp.route('/patrimoine_geologique/<int:id_site>', methods=['POST'])
def add_patrimoine_geologique(id_site):
    data = request.get_json()
    try:
        for heritage in data.get('geologicalHeritages', []):
            patrimoine = PatrimoineGeologiqueGestionnaire(
                id_site=id_site,
                lb=heritage['lb'],
                interet_geol_principal=heritage['interet_geol_principal'],
                nombre_etoiles=heritage['nombre_etoiles'],
                age_des_terrains_le_plus_recent=heritage.get('age_des_terrains_le_plus_recent'),
                age_des_terrains_le_plus_ancien=heritage.get('age_des_terrains_le_plus_ancien'),
                bibliographie=heritage['bibliographie']
            )
            db.session.add(patrimoine)
        db.session.commit()
        return jsonify({'message': 'Patrimoine géologique ajouté avec succès'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur lors de l\'ajout du patrimoine géologique', 'error': str(e)}), 500

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