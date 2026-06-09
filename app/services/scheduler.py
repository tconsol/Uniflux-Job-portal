from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.api.jobs.service import generate_daily_job_set

scheduler = AsyncIOScheduler()


async def precompute_all_daily_sets():
    for plan in ["basic", "standard", "premium", "elite"]:
        try:
            await generate_daily_job_set(plan)
        except Exception as e:
            print(f"Failed to generate daily job set for {plan}: {e}")


def start_scheduler():
    scheduler.add_job(
        precompute_all_daily_sets,
        trigger=CronTrigger(hour=0, minute=0, second=0),
        id="daily_job_sets",
        name="Generate daily job sets"
    )
    scheduler.start()


def stop_scheduler():
    if scheduler:
        scheduler.shutdown()