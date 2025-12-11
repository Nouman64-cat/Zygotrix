from fastapi import APIRouter, Depends
from typing import List

from ..schema.contact import (
    ContactFormRequest,
    ContactFormResponse,
    ContactSubmission,
)
from ..services import contact as contact_service
from ..dependencies import get_current_super_admin
from ..schema.auth import UserProfile

router = APIRouter(prefix="/api/contact", tags=["Contact"])


@router.post("/submit", response_model=ContactFormResponse, status_code=201)
def submit_contact_form(payload: ContactFormRequest) -> ContactFormResponse:
    """
    Submit a contact form.

    This endpoint allows anyone to submit a contact form.
    The email is automatically subscribed to the newsletter.
    """
    submission = contact_service.submit_contact_form(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        message=payload.message
    )

    return ContactFormResponse(
        message="Thank you for contacting us! We'll get back to you soon.",
        id=submission["id"],
        submitted_at=submission["submitted_at"]
    )


@router.get("/submissions", response_model=List[ContactSubmission])
def get_all_submissions(
    current_user: UserProfile = Depends(get_current_super_admin)
) -> List[ContactSubmission]:
    """
    Get all contact form submissions (Super Admin only).

    This endpoint is restricted to super admin users only.
    """
    submissions = contact_service.get_all_submissions()
    return [ContactSubmission(**sub) for sub in submissions]


@router.patch("/submissions/{submission_id}/read")
def mark_submission_as_read(
    submission_id: str,
    current_user: UserProfile = Depends(get_current_super_admin)
):
    """
    Mark a contact submission as read (Super Admin only).
    """
    contact_service.mark_as_read(submission_id)
    return {"message": "Submission marked as read."}


@router.delete("/submissions/{submission_id}")
def delete_submission(
    submission_id: str,
    current_user: UserProfile = Depends(get_current_super_admin)
):
    """
    Delete a contact form submission (Super Admin only).

    This endpoint is restricted to super admin users only.
    """
    contact_service.delete_submission(submission_id)
    return {"message": "Submission deleted successfully."}
