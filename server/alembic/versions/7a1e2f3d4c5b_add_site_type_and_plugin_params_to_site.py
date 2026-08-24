"""add site_type and plugin_params to site

Revision ID: 7a1e2f3d4c5b
Revises: b5bbe4364c83
Create Date: 2026-08-23 00:27:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a1e2f3d4c5b'
down_revision: Union[str, Sequence[str], None] = 'b5bbe4364c83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('site', schema=None) as batch_op:
        batch_op.add_column(sa.Column('site_type', sa.String(), nullable=False, server_default='builtin'))
        batch_op.add_column(sa.Column('plugin_params', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('site', schema=None) as batch_op:
        batch_op.drop_column('plugin_params')
        batch_op.drop_column('site_type')
