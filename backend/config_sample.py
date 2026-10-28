import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config :
    SECRET_KEY = 'masecretkeyadefinir'
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:postgres@localhost/socle2"
    MAIL_SERVER = 'z04z07.altospam.com'
    MAIL_PORT = 25
    MAIL_USE_TLS = False
    MAIL_USE_SSL = False
    MAIL_DEFAULT_SENDER = "si@rnfrance.org"
    MAIL_ASCII_ATTACHMENTS = False
    MAIL_USERNAME = ""
    MAIL_DEST_TECHNIQUE = "mail@mail.fr" #mail du destinataire technique
    MAIL_DEST_GEOL = "mail@mail.fr" #mail du destinataire thématique

    # --- Formulaire de contact : ouverture d'un ticket Zammad ---
    # Le jeton et la clé secrète du captcha restent côté serveur : le frontend
    # ne connaît que la route /contact.
    ZAMMAD_URL = "https://support.rnfrance.org"  # sans slash final
    ZAMMAD_TOKEN = ""       # jeton d'API d'un agent, permission ticket.agent sur le groupe
    ZAMMAD_GROUP = "Support SOCLE"
    RECAPTCHA_SECRET_KEY = ""  # clé secrète reCAPTCHA, pendant de captcha_key côté front
    URL_USERSHUB = 'https://usershub.reserves-naturelles.org' # sans slash final
    ID_APP = 11
    CODE_APPLICATION = "SOCLE"
    API_ENDPOINT="http://127.0.0.1:5068" #correspond à l'endpoint de cette api même
    COOKIE_EXPIRATION = 108000
    COOKIE_AUTORENEW = True