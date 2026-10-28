"""Trigger de croisement sites INPG et reserves

Recalcule cor_site_inpg quand le périmètre d'une réserve change.

La règle reproduit exactement la table existante : les 387 liens enregistrés
sont tous retrouvés par ST_Intersects sur les géométries actuelles.

Les décisions des gestionnaires sont préservées : un lien déjà présent n'est
jamais réécrit, donc ni `active` ni `raison_desactive` ne sont perdus. Seuls
les liens dont l'emprise INPG ne recoupe plus la réserve sont supprimés, leur
raison d'être ayant disparu avec le recoupement.

Revision ID: ce3ab3176f38
Revises: d6733424a976
Create Date: 2026-10-28

"""
from alembic import op

revision = 'ce3ab3176f38'
down_revision = 'd6733424a976'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE OR REPLACE FUNCTION public.maj_cor_site_inpg()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            -- Sur une mise à jour qui ne touche pas la géométrie, il n'y a rien
            -- à recalculer.
            IF TG_OP = 'UPDATE' AND NEW.geom IS NOT DISTINCT FROM OLD.geom THEN
                RETURN NULL;
            END IF;

            IF NEW.geom IS NULL THEN
                DELETE FROM cor_site_inpg WHERE site_id = NEW.id_site;
                RETURN NULL;
            END IF;

            -- Liens devenus caducs : l'emprise INPG ne recoupe plus la réserve.
            DELETE FROM cor_site_inpg c
             WHERE c.site_id = NEW.id_site
               AND NOT EXISTS (
                   SELECT 1 FROM inpg i
                    WHERE i.id_inpg = c.inpg_id
                      AND i.geom IS NOT NULL
                      AND ST_Intersects(i.geom, NEW.geom)
               );

            -- Nouveaux recoupements. Les liens déjà présents ne sont pas
            -- touchés : c'est ce qui préserve les sites écartés par le
            -- gestionnaire, avec leur raison.
            INSERT INTO cor_site_inpg (site_id, inpg_id)
            SELECT NEW.id_site, i.id_inpg
              FROM inpg i
             WHERE i.geom IS NOT NULL
               AND ST_Intersects(i.geom, NEW.geom)
               AND NOT EXISTS (
                   SELECT 1 FROM cor_site_inpg c
                    WHERE c.site_id = NEW.id_site AND c.inpg_id = i.id_inpg
               );

            RETURN NULL;
        END;
        $$;
    """)

    op.execute("""
        CREATE TRIGGER trg_maj_cor_site_inpg
        AFTER INSERT OR UPDATE OF geom ON public.site
        FOR EACH ROW
        EXECUTE FUNCTION public.maj_cor_site_inpg();
    """)


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS trg_maj_cor_site_inpg ON public.site;")
    op.execute("DROP FUNCTION IF EXISTS public.maj_cor_site_inpg();")
