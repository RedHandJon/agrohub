from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select, delete
from app.core.database import AsyncSessionLocal
from app.models.trip import Trip, TripStatus
from app.models.review import Notification
from app.models.user import User

scheduler = AsyncIOScheduler()


async def _auto_notify_overdue_trips():
    """Notify logist about trips planned more than 1h ago that are still 'planned'."""
    async with AsyncSessionLocal() as db:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
        result = await db.execute(
            select(Trip).where(
                Trip.status == TripStatus.planned,
                Trip.planned_date <= cutoff,
            )
        )
        trips = result.scalars().all()
        for trip in trips:
            # Notify driver if assigned
            if trip.driver_id:
                notif = Notification(
                    user_id=trip.driver_id,
                    title="Рейс ожидает начала",
                    body=f"Рейс #{trip.id} запланирован на {trip.planned_date.strftime('%d.%m %H:%M')} и ещё не начат.",
                )
                db.add(notif)
        await db.commit()


async def _cleanup_old_planning_jobs():
    """Delete planning_jobs older than 7 days."""
    from app.models.trip import PlanningJob
    async with AsyncSessionLocal() as db:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        await db.execute(
            delete(PlanningJob).where(PlanningJob.created_at <= cutoff)
        )
        await db.commit()


async def _send_order_status_notifications():
    """Placeholder: deliver pending push/email notifications."""
    # In a real app, this would iterate unread Notifications
    # and send emails or push messages to users.
    pass


def start_scheduler():
    scheduler.add_job(
        _auto_notify_overdue_trips,
        IntervalTrigger(minutes=15),
        id="notify_overdue_trips",
        replace_existing=True,
    )
    scheduler.add_job(
        _cleanup_old_planning_jobs,
        IntervalTrigger(hours=24),
        id="cleanup_planning_jobs",
        replace_existing=True,
    )
    scheduler.add_job(
        _send_order_status_notifications,
        IntervalTrigger(minutes=5),
        id="send_notifications",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
