import site
from venv import logger
from flask import Flask, request, Response, render_template, redirect, Blueprint, jsonify, g, abort
import requests
import json
from app import app, db
from models import Site, EntiteGeol, TInfosBaseSite
from schemas import TInfosBaseSiteSchema, SiteSchema
from pypnusershub import routes as fnauth

bp = Blueprint('routes', __name__)

@bp.route('/sites', methods=['GET'])
def getSites():
    sites = Site.query.all()
    schema = SiteSchema(many=True)
    siteObj = schema.dump(sites)
    return jsonify(siteObj)

@bp.route('/sites/<slug>', methods=['GET'])
def get_site_by_slug(slug):
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

@bp.route('/site/<slug>', methods=['GET'])
def getSite(slug):
    site = Site.query.filter_by(slug=slug).first()
    if site is None:
        abort(404)
    schema = SiteSchema()
    return schema.jsonify(site)

@bp.route('/t_infos_base_site', methods=['POST'])
def submitData():
    data = request.get_json()
    if not data or 'id_site' not in data:
        return jsonify({'type': 'error', 'msg': 'No data provided or id_site is missing'}), 400
    try:
        t_infos_base_site = TInfosBaseSite(
            id_site=data.get('id_site'),
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


@bp.route('/mini_quest/<slug>', methods=['PUT'])
def update_mini_quest(slug):
    try:
        data = request.get_json()
        mini_quest = MiniQuest.query.filter_by(slug=slug).first()
        if mini_quest:
            mini_quest.reserveCreatedOnGeologicalBasis = data.get('reserveCreatedOnGeologicalBasis', mini_quest.reserveCreatedOnGeologicalBasis)
            mini_quest.reserveContainsGeologicalHeritage_inpg = data.get('reserveContainsGeologicalHeritage_inpg', mini_quest.reserveContainsGeologicalHeritage_inpg)
            mini_quest.reserveContainsGeologicalHeritage_inpgDetails = data.get('reserveContainsGeologicalHeritage_inpgDetails', mini_quest.reserveContainsGeologicalHeritage_inpgDetails)
            mini_quest.reserveContainsGeologicalHeritage_other = data.get('reserveContainsGeologicalHeritage_other', mini_quest.reserveContainsGeologicalHeritage_other)
            mini_quest.reserveContainsGeologicalHeritage_otherDetails= data.get('reserveContainsGeologicalHeritage_otherDetails', mini_quest.reserveContainsGeologicalHeritage.otherDetails)
            mini_quest.reserveContainsGeologicalHeritage_none= data.get('reserveContainsGeologicalHeritage.none', mini_quest.reserveContainsGeologicalHeritage.none)

            db.session.commit()
            return jsonify({'type': 'success', 'msg': 'Mini-quest mise à jour avec succès !'})
        else:
            return jsonify({'message': 'Mini-quest non trouvée'}), 404
    except Exception as e:
        response = jsonify(
            type='bug',
            msg='Erreur lors de la mise à jour de la mini-quest en BDD',
            flask_message=str(e)
        )
        response.status_code = 500
        return response

