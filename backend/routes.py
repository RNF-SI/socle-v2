from flask import Flask, request, Response, render_template, redirect, Blueprint, jsonify, g
import requests
import json
from app import app, db

bp = Blueprint('routes', __name__)

from models import Site, EntiteGeol,MiniQuest #importation classe miniquest
from schemas import MiniQuestSchema, SiteSchema
from pypnusershub import routes as fnauth

@bp.route('/sites', methods=['GET'])
def getSites():

    sites = Site.query.all()

    schema = SiteSchema(many=True)
    siteObj = schema.dump(sites)

    return jsonify(siteObj)


@bp.route('/sites/<slug>', methods=['GET'])
def get_site_by_slug(slug):
    site = Site.query.filter_by(slug=slug).first()
    if site is None:
        abort(404)
    return site_schema.jsonify(site)

@bp.route('/sites', methods=['POST'])
def add_site():
    data = request.get_json()
    name = data['name']
    slug = generate_slug(name)
    site = Site(name=name, slug=slug)
    db.session.add(site)
    try:
        db.session.commit()
        return site_schema.jsonify(site), 201
    except exc.IntegrityError:
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

    site = Sites.query.filter(slug=slug).first()

    schema = SiteSchema(many=False)
    siteObj = schema.dump(site)

    return jsonify(siteObj)

# Ajout de miniquest
@bp.route('/mini_quest', methods=['POST'])
def mini_quest():

    if request.method == "POST":

        try :
            data = request.get_json()

            print(data)

        except Exception as e:
            response = jsonify(
                    type= 'bug',
                    msg= 'Erreur lors de l\'ajout des infos du mini formulaire en BDD',
                    flask_message= str(e)
            )
            response.status_code = 500
            return{response}
        
        return { 'type': 'success', 'msg': 'Données ajoutées !'}
        
    return {  'type': 'bug', 'msg': 'Erreur lors de l\'ajout des infos du mini formulaire en BDD', 'flask_message':str(e)}


# Récupération d'une mini-quest par son slug
@bp.route('/mini_quest/<slug>', methods=['GET'])
def get_mini_quest(slug):
    mini_quest = MiniQuest.query.filter_by(slug=slug).first()
    if mini_quest:
        schema = MiniQuestSchema()
        mini_quest_data = schema.dump(mini_quest)
        return jsonify(mini_quest_data)
    else:
        return jsonify({'message': 'Mini-quest non trouvée'}), 404

# Récupération de toutes les mini-quests
@bp.route('/mini_quests', methods=['GET'])
def get_all_mini_quests():
    mini_quests = MiniQuest.query.all()
    schema = MiniQuestSchema(many=True)
    mini_quests_data = schema.dump(mini_quests)
    return jsonify(mini_quests_data)

# Modification d'une mini-quest
@bp.route('/mini_quest/<slug>', methods=['PUT'])
def update_mini_quest(slug):
    if request.method == "PUT":
        try:
            data = request.get_json()
            # Récupère la mini-quest à mettre à jour
            mini_quest = MiniQuest.query.filter_by(slug=slug).first()
            if mini_quest:
                # Met à jour les champs de la mini-quest avec les données fournies
                mini_quest.titre = data.get('titre', mini_quest.titre)
                mini_quest.description = data.get('description', mini_quest.description)
                mini_quest.contenu = data.get('contenu', mini_quest.contenu)
                mini_quest.date = data.get('date', mini_quest.date)
                mini_quest.utilisateur_id = data.get('utilisateur_id', mini_quest.utilisateur_id)
                # Commit les modifications dans la base de données
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


    