import requests
import json

from flask import Flask, request, Response, render_template, redirect, current_app, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate

from importlib import import_module

from config import Config

import flask_login
from flask_login import current_user

from pypnusershub.login_manager import login_manager

from flask_mail import Mail

app = Flask(__name__)
app.config.from_object(Config)
cors = CORS(app)

login_manager.init_app(app)

CORS(app, supports_credentials=True)

db = SQLAlchemy(app) 
ma = Marshmallow(app)

migrate = Migrate(app, db)

mail = Mail(app)

# blueprint relié au module usershub-authentification
# pypnusershub 3 a supprimé routes_register : il n'y a plus de blueprint
# d'inscription à monter sous /pypn/register.
from pypnusershub.routes import routes
app.register_blueprint(routes, url_prefix='/auth')
 

import routes
app.register_blueprint(routes.bp)
