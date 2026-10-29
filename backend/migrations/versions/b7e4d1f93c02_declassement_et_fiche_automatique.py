"""Déclassement des réserves et création automatique de la fiche

Deux manques que la synchronisation avec RADIS fait apparaître.

1. RADIS ne supprime jamais une réserve, il la déclasse. SOCLE n'avait pas de
   quoi l'enregistrer, et une réserve sortie du réseau y restait affichée comme
   active — ou aurait dû être supprimée, ce qui emporterait sa fiche géologique
   et ses rattachements INPG. Trois colonnes suffisent à la retirer des listes
   en conservant la donnée saisie.

2. Un site créé par la synchronisation n'avait pas d'entrée dans
   `t_infos_base_site`, donc pas de questionnaire géologique. Le trigger la
   crée désormais à l'insertion. Les périmètres de protection en sont exclus :
   ce ne sont pas des réserves et ils n'ont pas de questionnaire propre.

Revision ID: b7e4d1f93c02
Revises: a1c7f2b40e93
Create Date: 2026-10-29

"""
from alembic import op
import sqlalchemy as sa


revision = 'b7e4d1f93c02'
down_revision = 'a1c7f2b40e93'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('site', sa.Column(
        'ancienne_reserve', sa.Boolean(), nullable=False, server_default=sa.false()
    ))
    op.add_column('site', sa.Column('date_declassement', sa.Date(), nullable=True))
    op.add_column('site', sa.Column('raison_declassement', sa.String(length=255), nullable=True))

    op.execute("""
        CREATE OR REPLACE FUNCTION public.cree_infos_base_site()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            -- Un périmètre de protection n'est pas une réserve : il n'a pas de
            -- questionnaire géologique à lui.
            IF NEW.perimetre_protection IS TRUE THEN
                RETURN NULL;
            END IF;

            INSERT INTO t_infos_base_site (id_site)
            VALUES (NEW.id_site)
            ON CONFLICT (id_site) DO NOTHING;

            RETURN NULL;
        END;
        $$;
    """)

    op.execute("""
        CREATE TRIGGER trg_cree_infos_base_site
        AFTER INSERT ON public.site
        FOR EACH ROW
        EXECUTE FUNCTION public.cree_infos_base_site();
    """)

    # Rattrapage des réserves déjà créées sans fiche. Idempotent : le NOT
    # EXISTS le rend sans effet si elles en ont une, et sans effet sur une base
    # vide.
    op.execute("""
        INSERT INTO t_infos_base_site (id_site)
        SELECT s.id_site
          FROM site s
         WHERE s.perimetre_protection IS NOT TRUE
           AND NOT EXISTS (
               SELECT 1 FROM t_infos_base_site t WHERE t.id_site = s.id_site
           );
    """)


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS trg_cree_infos_base_site ON public.site;")
    op.execute("DROP FUNCTION IF EXISTS public.cree_infos_base_site();")
    # Les fiches créées par le rattrapage ne sont pas supprimées : on ne
    # saurait pas distinguer celles créées ici de celles déjà présentes, et une
    # fiche vide ne gêne pas.
    op.drop_column('site', 'raison_declassement')
    op.drop_column('site', 'date_declassement')
    op.drop_column('site', 'ancienne_reserve')
