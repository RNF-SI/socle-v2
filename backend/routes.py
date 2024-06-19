from flask import Flask, request, Response, render_template, redirect, Blueprint, jsonify, g, abort
import requests
import json
from app import app, db
from models import Site, EntiteGeol, MiniQuest
from schemas import MiniQuestSchema, SiteSchema
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

@bp.route('/mini_quest', methods=['POST'])
def submitData():
    data = request.get_json()
    if not data:
        return jsonify({'type': 'error', 'msg': 'No data provided'}), 400

    # Debugging line to check received data
    print("Received data:", data)

    try:
        mini_quest = MiniQuest(
            slug=data.get('slug'),
            reserve_created_on_geological_basis=data.get('reserve_created_on_geological_basis'),
            reserve_contains_geological_heritage=data.get('reserveContainsGeologicalHeritage'),
            protection_perimeter_contains_geological_heritage=data.get('protectionPerimeterContainsGeologicalHeritage'),
            main_geological_interests=data.get('mainGeologicalInterests'),
            contains_paleontological_heritage=data.get('containsPaleontologicalHeritage'),
            reserve_has_geological_collections=data.get('collectionsGeologiquesPropres'),
            reserve_has_exhibition=data.get('expositionGeologiques'),
            geological_age=data.get('ageTerrains'),
            reserve_contains_stratotype=data.get('stratotype'),
            contains_subterranean_habitats=data.get('milieuxSouterrains'),
            associated_with_mineral_resources=data.get('exploitationMinerale'),
            has_geological_site_for_visitors=data.get('siteGeologiqueAmenege'),
            offers_geodiversity_activities=data.get('animationsGeodiversite')
        )
        db.session.add(mini_quest)
        db.session.commit()
        return jsonify({'type': 'success', 'msg': 'Mini-quest mise à jour ou ajoutée avec succès !'})
    except Exception as e:
        db.session.rollback()
        response = jsonify(
            type='bug',
            msg="Erreur lors de l'ajout ou mise à jour de la mini-quest en BDD",
            flask_message=str(e)
        )
        response.status_code = 500
        return response

    
@bp.route('/mini_quests', methods=['GET'])
def getAllMiniQuests():
    mini_quests = MiniQuest.query.all()
    schema = MiniQuestSchema(many=True)
    mini_quests_data = schema.dump(mini_quests)
    return jsonify(mini_quests_data)

@bp.route('/mini_quest/<slug>', methods=['GET'])
def get_mini_quest(slug):
    print('coucou')
    miniquest = MiniQuest.query.filter_by(slug=slug).first()
    schema = MiniQuestSchema(many=False)
    mini_quest_data = schema.dump(miniquest)
    return jsonify(mini_quest_data)

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

