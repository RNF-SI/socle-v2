import shapely
from marshmallow import fields
from geoalchemy2.shape import to_shape

from app import ma
from models import Site, EntiteGeol, TInfosBaseSite, Inpg

class SiteSchema(ma.SQLAlchemyAutoSchema):
    geom = fields.Method('wkt_to_geojson')

    def wkt_to_geojson(self, obj):
        if obj.geom:
            return shapely.geometry.mapping(to_shape(obj.geom))
        else:
            return None

    class Meta:
        model = Site

    entites_geol = ma.Nested(lambda: EntiteGeolSchema, many=True)
    infos_base = ma.Nested(lambda : TInfosBaseSiteSchema, many = True )
    inpg = ma .Nested(lambda : InpgSchema, many = True)

class EntiteGeolSchema(ma.SQLAlchemyAutoSchema):
    geom = fields.Method('wkt_to_geojson')

    def wkt_to_geojson(self, obj):
        if obj.geom:
            return shapely.geometry.mapping(to_shape(obj.geom))
        else:
            return None

    class Meta:
        model = EntiteGeol

class TInfosBaseSiteSchema(ma.SQLAlchemyAutoSchema):
    # geom = fields.Method('wkt_to_geojson')

    # def wkt_to_geojson(self, obj):
    #     if obj.geom:
    #         return shapely.geometry.mapping(to_shape(obj.geom))
    #     else:
    #         return None

    class Meta:
        model = TInfosBaseSite

class InpgSchema(ma.SQLAlchemyAutoSchema):
    geom = fields.Method('wkt_to_geojson')

    def wkt_to_geojson(self, obj):
        if obj.geom:
            return shapely.geometry.mapping(to_shape(obj.geom))
        else:
            return None

    class Meta :
        model = Inpg
