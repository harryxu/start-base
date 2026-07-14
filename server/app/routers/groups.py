"""Group CRUD API endpoints."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Group, GroupCreate, GroupRead, GroupUpdate, ReorderItem, Site

router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.get("/", response_model=List[GroupRead])
def list_groups(session: Session = Depends(get_session)) -> List[Group]:
    """Return all groups ordered by sort_order."""
    return list(session.exec(select(Group).order_by(Group.sort_order)).all())


@router.post("/", response_model=GroupRead, status_code=201)
def create_group(
    group_in: GroupCreate, session: Session = Depends(get_session)
) -> Group:
    """Create a new group."""
    group = Group.model_validate(group_in)
    session.add(group)
    session.commit()
    session.refresh(group)
    return group


@router.patch("/{group_id}", response_model=GroupRead)
def update_group(
    group_id: int,
    group_in: GroupUpdate,
    session: Session = Depends(get_session),
) -> Group:
    """Update a group's name or sort_order."""
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    update_data = group_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(group, key, value)

    session.add(group)
    session.commit()
    session.refresh(group)
    return group


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int, session: Session = Depends(get_session)
) -> None:
    """Delete a group. Its sites become ungrouped (group_id → null)."""
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Ungroup all sites belonging to this group
    orphaned = session.exec(select(Site).where(Site.group_id == group_id)).all()
    for site in orphaned:
        site.group_id = None
        session.add(site)

    session.delete(group)
    session.commit()


@router.post("/reorder", status_code=204)
def reorder_groups(
    items: List[ReorderItem], session: Session = Depends(get_session)
) -> None:
    """Bulk-update sort_order for multiple groups."""
    for item in items:
        group = session.get(Group, item.id)
        if group:
            group.sort_order = item.sort_order
            session.add(group)
    session.commit()
