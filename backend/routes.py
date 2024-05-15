from flask import Flask, request, Response, render_template, redirect, Blueprint, jsonify, g
import requests
import json

bp = Blueprint('routes', __name__)

from flask_mail import Mail, Message

from models import Site, EntiteGeol
from schemas import SiteSchema

from pypnusershub import routes as fnauth

from flask_login import login_required

from app import app

mail = Mail(app)

@bp.route('/sites', methods=['GET'])
def getSites():

    sites = Site.query.all()

    schema = SiteSchema(many=True)
    siteObj = schema.dump(sites)

    return jsonify(siteObj)