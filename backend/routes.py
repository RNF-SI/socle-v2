import site
from venv import logger
from flask import Flask, request, Response, render_template, redirect, Blueprint, jsonify, g, abort
import requests
import json
from app import app, db
from models import PatrimoineGeologiqueGestionnaire, Site, EntiteGeol, TInfosBaseSite
from schemas import TInfosBaseSiteSchema, SiteSchema
from pypnusershub import routes as fnauth

bp = Blueprint('routes', __name__)

@bp.route('/sites', methods=['GET'])
def getSites():
    sites = Site.query.all()
    schema = SiteSchema(many=True)
    siteObj = schema.dump(sites)
    return jsonify(siteObj)

@bp.route('/site/<slug>', methods=['GET'])
def getSiteBySlug(slug):
    print(f"Fetching details for slug: {slug}")  # Ajoutez ce log
    site = Site.query.filter_by(slug=slug).first()
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
            geological_age=data.get('geological_age'),
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
        t_infos_base_site = TInfosBaseSite.query.filter_by(slug=slug).first()
        
        if not t_infos_base_site:
            return jsonify({'message': 'TInfosBaseSite non trouvée'}), 404
        
        # Mise à jour des champs
        t_infos_base_site.reserve_created_on_geological_basis = data.get('reserve_created_on_geological_basis', t_infos_base_site.reserve_created_on_geological_basis)
        #t_infos_base_site.reserve_contains_geological_heritage_inpg = data.get('reserve_contains_geological_heritage_inpg', t_infos_base_site.reserve_contains_geological_heritage_inpg)
        #t_infos_base_site.reserve_contains_geological_heritage_other = data.get('reserve_contains_geological_heritage_other', t_infos_base_site.reserve_contains_geological_heritage_other)
        t_infos_base_site.protection_perimeter_contains_geological_heritage_inpg = data.get('protection_perimeter_contains_geological_heritage_inpg', t_infos_base_site.protection_perimeter_contains_geological_heritage_inpg)
        t_infos_base_site.protection_perimeter_contains_geological_heritage_other = data.get('protection_perimeter_contains_geological_heritage_other', t_infos_base_site.protection_perimeter_contains_geological_heritage_other)
        
        # Handle nested data for main_geological_interests
        main_geological_interests = data.get('main_geological_interests', {})
        t_infos_base_site.main_geological_interests_stratigraphic = main_geological_interests.get('stratigraphic', t_infos_base_site.main_geological_interests_stratigraphic)
        t_infos_base_site.main_geological_interests_paleontological = main_geological_interests.get('paleontological', t_infos_base_site.main_geological_interests_paleontological)
        t_infos_base_site.main_geological_interests_sedimentological = main_geological_interests.get('sedimentological', t_infos_base_site.main_geological_interests_sedimentological)
        t_infos_base_site.main_geological_interests_geomorphological = main_geological_interests.get('geomorphological', t_infos_base_site.main_geological_interests_geomorphological)
        t_infos_base_site.main_geological_interests_mineral_resource = main_geological_interests.get('mineral_resource', t_infos_base_site.main_geological_interests_mineral_resource)
        t_infos_base_site.main_geological_interests_mineralogical = main_geological_interests.get('mineralogical', t_infos_base_site.main_geological_interests_mineralogical)
        t_infos_base_site.main_geological_interests_metamorphism = main_geological_interests.get('metamorphism', t_infos_base_site.main_geological_interests_metamorphism)
        t_infos_base_site.main_geological_interests_volcanism = main_geological_interests.get('volcanism', t_infos_base_site.main_geological_interests_volcanism)
        t_infos_base_site.main_geological_interests_plutonism = main_geological_interests.get('plutonism', t_infos_base_site.main_geological_interests_plutonism)
        t_infos_base_site.main_geological_interests_hydrogeology = main_geological_interests.get('hydrogeology', t_infos_base_site.main_geological_interests_hydrogeology)
        t_infos_base_site.main_geological_interests_tectonics = main_geological_interests.get('tectonics', t_infos_base_site.main_geological_interests_tectonics)
        
        # Handle nested data for contains_paleontological_heritage
        contains_paleontological_heritage = data.get('contains_paleontological_heritage', {})
        t_infos_base_site.contains_paleontological_heritage = contains_paleontological_heritage.get('answer', t_infos_base_site.contains_paleontological_heritage)
        t_infos_base_site.contains_paleontological_heritage_vertebrates = contains_paleontological_heritage.get('vertebrates', t_infos_base_site.contains_paleontological_heritage_vertebrates)
        t_infos_base_site.contains_paleontological_heritage_invertebrates = contains_paleontological_heritage.get('invertebrates', t_infos_base_site.contains_paleontological_heritage_invertebrates)
        t_infos_base_site.contains_paleontological_heritage_plants = contains_paleontological_heritage.get('plants', t_infos_base_site.contains_paleontological_heritage_plants)
        t_infos_base_site.contains_paleontological_heritage_trace_fossils = contains_paleontological_heritage.get('traceFossils', t_infos_base_site.contains_paleontological_heritage_trace_fossils)
        t_infos_base_site.contains_paleontological_heritage_other = contains_paleontological_heritage.get('other', t_infos_base_site.contains_paleontological_heritage_other)
        t_infos_base_site.contains_paleontological_heritage_other_details = contains_paleontological_heritage.get('otherDetails', t_infos_base_site.contains_paleontological_heritage_other_details)
        
        # Continue updating other fields as done previously
        t_infos_base_site.reserve_has_geological_collections = data.get('reserve_has_geological_collections', t_infos_base_site.reserve_has_geological_collections)
        t_infos_base_site.reserve_has_exhibition = data.get('reserve_has_exhibition', t_infos_base_site.reserve_has_exhibition)
        t_infos_base_site.geological_age = data.get('geological_age', t_infos_base_site.geological_age)
        t_infos_base_site.etage = data.get('etage', t_infos_base_site.etage)
        t_infos_base_site.ere_periode_epoque = data.get('ere_periode_epoque', t_infos_base_site.ere_periode_epoque)
        t_infos_base_site.reserve_contains_stratotype = data.get('reserve_contains_stratotype', t_infos_base_site.reserve_contains_stratotype)
        t_infos_base_site.stratotype_limit = data.get('stratotype_limit', t_infos_base_site.stratotype_limit)  # Nouveau champ
        t_infos_base_site.stratotype_limit_input = data.get('stratotype_limit_input', t_infos_base_site.stratotype_limit_input)  # Nouveau champ
        t_infos_base_site.stratotype_stage = data.get('stratotype_stage', t_infos_base_site.stratotype_stage)
        t_infos_base_site.stratotype_stage_input = data.get('stratotype_stage_input', t_infos_base_site.stratotype_stage_input)
        t_infos_base_site.contains_subterranean_habitats = data.get('contains_subterranean_habitats', t_infos_base_site.contains_subterranean_habitats)
        t_infos_base_site.subterranean_habitats_natural_cavities = data.get('subterranean_habitats_natural_cavities', t_infos_base_site.subterranean_habitats_natural_cavities)
        t_infos_base_site.subterranean_habitats_anthropogenic_cavities = data.get('subterranean_habitats_anthropogenic_cavities', t_infos_base_site.subterranean_habitats_anthropogenic_cavities)
        t_infos_base_site.associated_with_mineral_resources = data.get('associated_with_mineral_resources', t_infos_base_site.associated_with_mineral_resources)
        t_infos_base_site.mineral_resources_old_quarry = data.get('mineral_resources_old_quarry', t_infos_base_site.mineral_resources_old_quarry)
        t_infos_base_site.mineral_resources_active_quarry = data.get('mineral_resources_active_quarry', t_infos_base_site.mineral_resources_active_quarry)
        t_infos_base_site.quarry_extracted_material = data.get('quarry_extracted_material', t_infos_base_site.quarry_extracted_material)
        t_infos_base_site.quarry_fossiliferous_material = data.get('quarry_fossiliferous_material', t_infos_base_site.quarry_fossiliferous_material)
        t_infos_base_site.mineral_resources_old_mine = data.get('mineral_resources_old_mine', t_infos_base_site.mineral_resources_old_mine)
        t_infos_base_site.mineral_resources_active_mine = data.get('mineral_resources_active_mine', t_infos_base_site.mineral_resources_active_mine)
        t_infos_base_site.mine_extracted_material = data.get('mine_extracted_material', t_infos_base_site.mine_extracted_material)
        t_infos_base_site.mine_fossiliferous_material = data.get('mine_fossiliferous_material', t_infos_base_site.mine_fossiliferous_material)
        t_infos_base_site.reserve_has_geological_site_for_visitors = data.get('reserve_has_geological_site_for_visitors', t_infos_base_site.reserve_has_geological_site_for_visitors)
        t_infos_base_site.offers_geodiversity_activities = data.get('offers_geodiversity_activities', t_infos_base_site.offers_geodiversity_activities)

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
    


### 
@bp.route('/patrimoine_geologique/<int:id_site>', methods=['GET'])
def get_patrimoine_geologique(id_site):
    try:
        site = Site.query.get(id_site)
        if not site:
            return jsonify({'error': 'Site not found'}), 404

        geological_heritages = PatrimoineGeologiqueGestionnaire.query.filter_by(id_site=id_site).all()
        
        heritage_list = []
        for heritage in geological_heritages:
            heritage_data = {
                'id_patrimoine': heritage.id_patrimoine,
                'lb': heritage.lb,
                'nombre_etoiles': heritage.nombre_etoiles,
                'interet_geol_principal': heritage.interet_geol_principal,
                'age_des_terrains_le_plus_recent': heritage.age_des_terrains_le_plus_recent,
                'age_des_terrains_le_plus_ancien': heritage.age_des_terrains_le_plus_ancien,
                'bibliographie': heritage.bibliographie
            }
            heritage_list.append(heritage_data)
        
        return jsonify(heritage_list)  # Ensure this returns a list
    except Exception as e:
        app.logger.error(f"Error fetching geological heritage: {str(e)}")
        return jsonify({'error': str(e)}), 500


    
@bp.route('/patrimoine_geologique/<int:id_site>', methods=['PUT'])
def update_patrimoine_geologique(id_site):
    data = request.json
    try:
        site = Site.query.get(id_site)
        if not site:
            return jsonify({'error': 'Site not found'}), 404

        existing_heritages = {heritage.id_patrimoine: heritage for heritage in PatrimoineGeologiqueGestionnaire.query.filter_by(id_site=id_site).all()}
        
        updated_heritages_ids = []
        for heritage_data in data.get('geological_heritages', []):
            heritage_id = heritage_data.get('id_patrimoine')
            if heritage_id in existing_heritages:
                heritage = existing_heritages[heritage_id]
                heritage.lb = heritage_data.get('lb', heritage.lb)
                heritage.nombre_etoiles = heritage_data.get('nombre_etoiles', heritage.nombre_etoiles)
                heritage.interet_geol_principal = heritage_data.get('interet_geol_principal', heritage.interet_geol_principal)
                heritage.age_des_terrains_le_plus_recent = heritage_data.get('age_des_terrains_le_plus_recent', heritage.age_des_terrains_le_plus_recent)
                heritage.age_des_terrains_le_plus_ancien = heritage_data.get('age_des_terrains_le_plus_ancien', heritage.age_des_terrains_le_plus_ancien)
                heritage.bibliographie = heritage_data.get('bibliographie', heritage.bibliographie)
                updated_heritages_ids.append(heritage.id_patrimoine)
            else:
                new_heritage = PatrimoineGeologiqueGestionnaire(
                    id_site=id_site,
                    lb=heritage_data['lb'],
                    nombre_etoiles=heritage_data['nombre_etoiles'],
                    interet_geol_principal=heritage_data['interet_geol_principal'],
                    age_des_terrains_le_plus_recent=heritage_data['age_des_terrains_le_plus_recent'],
                    age_des_terrains_le_plus_ancien=heritage_data['age_des_terrains_le_plus_ancien'],
                    bibliographie=heritage_data['bibliographie']
                )
                db.session.add(new_heritage)
                db.session.flush()  # Pour obtenir l'ID du nouvel héritage
                updated_heritages_ids.append(new_heritage.id_patrimoine)
        
        # Suppression des héritages non inclus dans la mise à jour
        for heritage_id in existing_heritages:
            if heritage_id not in updated_heritages_ids:
                db.session.delete(existing_heritages[heritage_id])

        db.session.commit()
        return jsonify({'message': 'Geological heritage updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
