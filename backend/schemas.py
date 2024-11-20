from marshmallow import fields
from shapely.geometry import mapping
from geoalchemy2.shape import to_shape
import shapely


from app import ma
from models import PatrimoineGeologiqueGestionnaire, Site, EntiteGeol, TInfosBaseSite, Inpg, Nomenclature, BibNomenclatureType, CorSiteSubstance, Stratotype, CorSiteInpg


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
    sites_inpg = fields.Method('get_sorted_sites_inpg')
    def get_sorted_sites_inpg(self, obj):
        # Trier les sites_inpg par nombre_etoiles (desc) et lb_site (asc)
        sorted_sites = sorted(
            obj.sites_inpg,
            key=lambda x: (-x.inpg.nombre_etoiles if x.inpg and x.inpg.nombre_etoiles is not None else 0, 
                        x.inpg.lb_site if x.inpg and x.inpg.lb_site else '')
        )

        # Sérialiser avec CorSiteInpgSchema
        return CorSiteInpgSchema(many=True).dump(sorted_sites)
    
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
    # sites_inpg = ma.Nested(lambda: CorSiteInpgSchema, many=True)
    sites_inpg = fields.Method('get_sorted_sites_inpg')
    ages = ma.Nested(lambda: NomenclatureSchema, many=True)
    perimetre_protection = ma.Nested(PerimetreProtectionSchema, many=False, attribute='perimetre_protection_site')
    patrimoines_geologiques = ma.Nested(lambda: PatrimoineGeologiqueGestionnaireSchema, many=True)
    substances = ma.Nested(lambda:CorSiteSubstanceSchema, many = True)
    stratotypes = ma.Nested(lambda:StratotypeSchema, many = True)

    def get_sorted_sites_inpg(self, obj):
        # Trier les sites_inpg par nombre_etoiles (desc) et lb_site (asc)
        sorted_sites = sorted(
            obj.sites_inpg,
            key=lambda x: (-x.inpg.nombre_etoiles if x.inpg and x.inpg.nombre_etoiles is not None else 0, 
                        x.inpg.lb_site if x.inpg and x.inpg.lb_site else '')
        )

        # Sérialiser avec CorSiteInpgSchema
        return CorSiteInpgSchema(many=True).dump(sorted_sites)


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

    sites_inpg = fields.Method('get_sorted_sites_inpg')
    patrimoines_geologiques = ma.Nested(lambda: PatrimoineGeologiqueGestionnaireSchema(only=("lb",)), many=True)
    stratotypes = ma.Nested(lambda:StratotypeSchema, many = True)

    def get_sorted_sites_inpg(self, obj):
        # Trier les sites_inpg par nombre_etoiles (desc) et lb_site (asc)
        sorted_sites = sorted(
            obj.sites_inpg,
            key=lambda x: (-x.inpg.nombre_etoiles if x.inpg and x.inpg.nombre_etoiles is not None else 0, 
                        x.inpg.lb_site if x.inpg and x.inpg.lb_site else '')
        )

        # Sérialiser avec CorSiteInpgSchema
        return CorSiteInpgSchema(only=("active","inpg.id_metier","inpg.lb_site", "inpg.niveau_de_diffusion"),many=True).dump(sorted_sites)

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

class CorSiteInpgSchema(ma.SQLAlchemyAutoSchema) :
    class Meta:
        model = CorSiteInpg
        load_relationships = True

    inpg = ma.Nested(lambda:InpgSchema)   