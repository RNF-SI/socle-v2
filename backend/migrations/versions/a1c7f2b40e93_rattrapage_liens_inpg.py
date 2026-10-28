"""Rattrapage des liens INPG manquants

Le trigger de la révision précédente ne s'applique qu'aux changements à venir.
Cette migration crée les liens que le croisement ST_Intersects trouve mais qui
manquent dans cor_site_inpg — des recoupements réels, de 0,07 à 193 ha.

Elle est idempotente : le NOT EXISTS la rend sans effet si les liens existent
déjà, et sans effet non plus sur une base vide.

Revision ID: a1c7f2b40e93
Revises: ce3ab3176f38
Create Date: 2026-10-28

"""
from alembic import op

revision = 'a1c7f2b40e93'
down_revision = 'ce3ab3176f38'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        INSERT INTO cor_site_inpg (site_id, inpg_id)
        SELECT s.id_site, i.id_inpg
          FROM site s
          JOIN inpg i ON ST_Intersects(s.geom, i.geom)
         WHERE s.geom IS NOT NULL
           AND i.geom IS NOT NULL
           AND NOT EXISTS (
               SELECT 1 FROM cor_site_inpg c
                WHERE c.site_id = s.id_site AND c.inpg_id = i.id_inpg
           );
    """)


def downgrade():
    # Rien à défaire : ces liens sont ceux que le croisement produit, et on ne
    # saurait pas distinguer les lignes créées ici de celles déjà présentes.
    pass
