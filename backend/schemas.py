import shapely
from flask_marshmallow import fields
from geoalchemy2.shape import to_shape

from app import ma

from models import Site, EntiteGeol

class SiteSchema(ma.SQLAlchemyAutoSchema) :

    geom = fields.fields.Method('wkt_to_geojson')


    def wkt_to_geojson(self, obj):
        if obj.geom :
            return shapely.geometry.mapping(to_shape(obj.geom))
        else :
            return None
    class Meta :
        model = Site

    entites_geol = ma.Nested(lambda: EntiteGeolSchema, many = True)

class EntiteGeolSchema(ma.SQLAlchemyAutoSchema) :

    geom = fields.fields.Method('wkt_to_geojson')

    def wkt_to_geojson(self, obj):
        if obj.geom :
            return shapely.geometry.mapping(to_shape(obj.geom))
        else :
            return None

    #fonction permettant de serialiser les données géographiques, à voir si on ne peut pas factoriser cette fonction

    class Meta :
        model = EntiteGeol