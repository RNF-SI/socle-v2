from flask import Flask, request, Response, render_template, redirect, Blueprint, jsonify, g
import requests
import json
from app import app

bp = Blueprint('routes', __name__)

from models import Site, EntiteGeol,MiniQuest #importation classe miniquest
from schemas import SiteSchema
from pypnusershub import routes as fnauth

@bp.route('/sites', methods=['GET'])
def getSites():

    sites = Site.query.all()

    schema = SiteSchema(many=True)
    siteObj = schema.dump(sites)

    return jsonify(siteObj)

@bp.route('/site/<slug>', methods=['GET'])
def getSite(slug):

    site = Sites.query.filter(slug=slug).first()

    schema = SiteSchema(many=False)
    siteObj = schema.dump(site)

    return jsonify(siteObj)

# Ajout de miniquest

@bp.route('/mini_quests', methods=['POST'])
def add_mini_quest():
    reserve_created_on_geological_basis = request.json['reserve_created_on_geological_basis']
    reserve_contains_geological_heritage = request.json['reserve_contains_geological_heritage']
    protection_perimeter_contains_geological_heritage = request.json['protection_perimeter_contains_geological_heritage']
    main_geological_interests = request.json['main_geological_interests']
    contains_paleontological_heritage = request.json['contains_paleontological_heritage']
    reserve_has_geological_collections = request.json['reserve_has_geological_collections']
    reserve_has_exhibition = request.json['reserve_has_exhibition']
    geological_age = request.json['geological_age']
    reserve_contains_stratotype = request.json['reserve_contains_stratotype']
    contains_subterranean_habitats = request.json['contains_subterranean_habitats']
    associated_with_mineral_resources = request.json['associated_with_mineral_resources']
    has_geological_site_for_visitors = request.json['has_geological_site_for_visitors']
    offers_geodiversity_activities = request.json['offers_geodiversity_activities']

    nouvelle_mini_quest = MiniQuest(
        reserve_created_on_geological_basis=reserve_created_on_geological_basis,
        reserve_contains_geological_heritage=reserve_contains_geological_heritage,
        protection_perimeter_contains_geological_heritage=protection_perimeter_contains_geological_heritage,
        main_geological_interests=main_geological_interests,
        contains_paleontological_heritage=contains_paleontological_heritage,
        reserve_has_geological_collections=reserve_has_geological_collections,
        reserve_has_exhibition=reserve_has_exhibition,
        geological_age=geological_age,
        reserve_contains_stratotype=reserve_contains_stratotype,
        contains_subterranean_habitats=contains_subterranean_habitats,
        associated_with_mineral_resources=associated_with_mineral_resources,
        has_geological_site_for_visitors=has_geological_site_for_visitors,
        offers_geodiversity_activities=offers_geodiversity_activities
    )

    db.session.add(nouvelle_mini_quest)
    db.session.commit()

    return jsonify({'message': 'MiniQuest added successfully'}), 201