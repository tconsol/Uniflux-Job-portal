from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from datetime import datetime

from app.api.jobs.schemas import JobResponse, JobsListResponse, JobFilters
from app.api.jobs.service import get_daily_job_set, get_jobs_with_filters, get_job_by_id, ingest_jobs_from_aggregation
from app.dependencies import get_current_user, get_current_subscription
from app.database import plans_collection

router = APIRouter()


@router.get("/", response_model=JobsListResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    salary_min: Optional[int] = None,
    company: Optional[str] = None,
    skills: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user),
    subscription: dict = Depends(get_current_subscription)
):
    plan = subscription["plan"]
    today = datetime.utcnow().date().isoformat()
    job_ids = await get_daily_job_set(today, plan)
    if not job_ids:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No jobs available for your plan")

    filters = {
        "location": location,
        "job_type": job_type,
        "salary_min": salary_min,
        "company": company,
        "skills": skills
    }

    jobs_list = await get_jobs_with_filters(job_ids, filters)
    total = len(jobs_list)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_jobs = jobs_list[start_idx:end_idx]
    plans = plans_collection()
    plan_doc = plans.find_one({"slug": plan})
    job_limit = plan_doc.get("job_limit", 10) if plan_doc else 10

    return JobsListResponse(
        jobs=[
            JobResponse(
                job_id=str(job["_id"]),
                title=job["title"],
                company=job["company"],
                location=job["location"],
                job_type=job["job_type"],
                salary_min=job.get("salary_min"),
                salary_max=job.get("salary_max"),
                salary_currency=job.get("salary_currency", "USD"),
                skills=job.get("skills", []),
                description=job["description"],
                apply_url=job["apply_url"],
                posted_at=job["posted_at"],
                source=job.get("source", "unknown")
            )
            for job in paginated_jobs
        ],
        total=total,
        page=page,
        limit=limit,
        plan=plan,
        job_limit=job_limit
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await get_job_by_id(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobResponse(
        job_id=str(job["_id"]),
        title=job["title"],
        company=job["company"],
        location=job["location"],
        job_type=job["job_type"],
        salary_min=job.get("salary_min"),
        salary_max=job.get("salary_max"),
        salary_currency=job.get("salary_currency", "USD"),
        skills=job.get("skills", []),
        description=job["description"],
        apply_url=job["apply_url"],
        posted_at=job["posted_at"],
        source=job.get("source", "unknown")
    )


@router.post("/search", response_model=JobsListResponse)
async def search_jobs(
    filters: JobFilters,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    subscription: dict = Depends(get_current_subscription)
):
    return await list_jobs(
        page=page,
        limit=limit,
        location=filters.location,
        job_type=filters.job_type,
        salary_min=filters.salary_min,
        company=filters.company,
        skills=filters.skills,
        current_user=current_user,
        subscription=subscription
    )


@router.post("/ingest")
async def ingest_jobs(jobs_data: List[dict], current_user: dict = Depends(get_current_user)):
    count = await ingest_jobs_from_aggregation(jobs_data)
    return {"ingested_count": count, "message": f"Successfully ingested {count} jobs"}