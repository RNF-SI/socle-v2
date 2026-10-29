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
    ZAMMAD_URL = "https://zammad.reserves-naturelles.org"  # sans slash final
    # Jeton d'API d'un agent ayant le droit « create » SUR LE GROUPE CI-DESSOUS.
    # Un jeton d'une autre application ne suffit pas : les droits sont par
    # groupe, et Zammad répond 403 « Not authorized » à la création.
    ZAMMAD_TOKEN = ""
    ZAMMAD_GROUP = "Support SI RNF::Support SOCLE"  # nom exact, groupes imbriqués avec ::
    TURNSTILE_SECRET = ""  # clé secrète Cloudflare Turnstile, pendant de turnstileSiteKey côté front
    # --- Synchronisation des réserves depuis RADIS ---
    # SOCLE tire les périmètres et les métadonnées des réserves par l'API
    # publique de RADIS (`flask synchro-radis`), au lieu d'être écrit
    # directement par elle. La clé s'obtient auprès du Pôle SI.
    RADIS_API_URL = "https://radis.reserves-naturelles.org"  # sans slash final
    RADIS_API_KEY = ""

    URL_USERSHUB = 'https://usershub.reserves-naturelles.org' # sans slash final
    ID_APP = 11
    CODE_APPLICATION = "SOCLE"
    API_ENDPOINT="http://127.0.0.1:5068" #correspond à l'endpoint de cette api même
    COOKIE_EXPIRATION = 108000
    COOKIE_AUTORENEW = True