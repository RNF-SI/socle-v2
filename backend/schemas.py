from marshmallow import fields
from shapely.geometry import mapping
from geoalchemy2.shape import to_shape
import shapely


from app import ma
from models import PatrimoineGeologiqueGestionnaire, Site, EntiteGeol, TInfosBaseSite, Inpg, Nomenclature, BibNomenclatureType, CorSiteSubstance, Stratotype


class PerimetreProtectionSchema(ma.SQLAlchemyAutoSchema):
    geom = fields.Method('wkt_to_geojson')

    def wkt_to_geojson(self, obj):
        if obj.geom:
            return shapely.geometry.mapping(to_shape(obj.geom))
        else:
            return None
    class Meta:
        model = Site
        exclude = ['geom_point']   
    inpg = ma.Nested(lambda: InpgSchema, many=True)
    
    patrimoines_geologiques = ma.Nested(lambda: PatrimoineGeologiqueGestionnaireSchema, many=True)



 
        
class SiteSchema(ma.SQLAlchemyAutoSchema):
    geom = fields.Method('wkt_to_geojson')
    geom_point = fields.Method('wkt_to_geojson_point')  # Custom method for geom_point

    def wkt_to_geojson(self, obj):
        if obj.geom:
            return shapely.geometry.mapping(to_shape(obj.geom))
        else:
            return None

    def wkt_to_geojson_point(self, obj):
        if obj.geom_point:
            return shapely.geometry.mapping(to_shape(obj.geom_point))
        else:
            return None

    class Meta:
        model = Site
        exclude = ['geom_point']   
       

    entites_geol = ma.Nested(lambda: EntiteGeolSchema, many=True)
    infos_base = ma.Nested(lambda: TInfosBaseSiteSchema, many=False)
    inpg = ma.Nested(lambda: InpgSchema, many=True)
    ages = ma.Nested(lambda: NomenclatureSchema, many=True)
    perimetre_protection = ma.Nested(PerimetreProtectionSchema, many=False, attribute='perimetre_protection_site')
    patrimoines_geologiques = ma.Nested(lambda: PatrimoineGeologiqueGestionnaireSchema, many=True)
    substances = ma.Nested(lambda:CorSiteSubstanceSchema, many = True)
    stratotypes = ma.Nested(lambda:StratotypeSchema, many = True)

class SiteSchemaSimple(ma.SQLAlchemyAutoSchema):
    geom = fields.Method('wkt_to_geojson')
    geom_point = fields.Method('wkt_to_geojson_point')  # Custom method for geom_point

    def wkt_to_geojson(self, obj):
        if obj.geom:
            return shapely.geometry.mapping(to_shape(obj.geom))
        else:
            return None
    def wkt_to_geojson_point(self, obj):
        if obj.geom_point:
            return shapely.geometry.mapping(to_shape(obj.geom_point))
        else:
            return None

    class Meta:
        model = Site 

    inpg = ma.Nested(lambda: InpgSchema(only=("id_metier","lb_site", "niveau_de_diffusion")), many=True)
    patrimoines_geologiques = ma.Nested(lambda: PatrimoineGeologiqueGestionnaireSchema(only=("lb",)), many=True)

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
        

class NomenclatureSchema(ma.SQLAlchemyAutoSchema):
    class Meta :
        model = Nomenclature
        include_fk = True
        

class NomenclatureTypeSchema(ma.SQLAlchemyAutoSchema):
    class Meta :
        model = BibNomenclatureType
        include_fk = True
          
    
    nomenclatures = ma.Nested(lambda: NomenclatureSchema, many=True, attribute="sorted_nomenclatures")

class PatrimoineGeologiqueGestionnaireSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = PatrimoineGeologiqueGestionnaire
        include_fk = True
     

class CorSiteSubstanceSchema(ma.SQLAlchemyAutoSchema) :
    class Meta:
        model = CorSiteSubstance
        load_relationships = True

    substance = ma.Nested(lambda:NomenclatureSchema)   

class StratotypeSchema(ma.SQLAlchemyAutoSchema) :
    class Meta:
        model = Stratotype