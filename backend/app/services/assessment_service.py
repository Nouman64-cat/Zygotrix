"""Assessment service - business logic for assessments."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from uuid import uuid4

from app.repositories.assessment_repository import AssessmentRepository
from app.repositories.progress_repository import ProgressRepository


class AssessmentService:
    """Business logic for assessment submission and grading."""

    def __init__(self):
        self.assessment_repo = AssessmentRepository()
        self.progress_repo = ProgressRepository()

    def submit_assessment(
        self,
        user_id: str,
        course_slug: str,
        module_id: str,
        questions: List[Dict[str, Any]],
        answers: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Submit and grade an assessment.

        This is the refactored version that:
        1. Grades the assessment
        2. Saves the attempt
        3. Updates progress status
        4. Returns the result

        All in one clean, testable function.
        """
        # Grade the assessment
        total_questions = len(questions)
        correct_answers = 0
        processed_answers = []

        for answer in answers:
            question_index = answer.get("question_index")
            selected_option_index = answer.get("selected_option_index")

            if question_index < 0 or question_index >= total_questions:
                continue

            question = questions[question_index]
            options = question.get("options", [])

            if selected_option_index < 0 or selected_option_index >= len(options):
                continue

            selected_option = options[selected_option_index]

            # Check both snake_case and camelCase for compatibility
            is_correct = (
                selected_option.get("is_correct") == True
                or selected_option.get("isCorrect") == True
            )

            if is_correct:
                correct_answers += 1

            processed_answers.append(
                {
                    "questionIndex": question_index,
                    "selectedOptionIndex": selected_option_index,
                    "isCorrect": is_correct,
                }
            )

        # Calculate score and pass/fail
        score = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        passed = score >= 80.0

        # Get attempt number
        attempt_number = (
            self.assessment_repo.get_latest_attempt_number(
                user_id, course_slug, module_id
            )
            + 1
        )

        # Create attempt record
        attempt_doc = {
            "id": str(uuid4()),
            "user_id": user_id,
            "course_slug": course_slug,
            "module_id": module_id,
            "attempt_number": attempt_number,
            "answers": processed_answers,
            "score": score,
            "total_questions": total_questions,
            "passed": passed,
            "completed_at": datetime.now(timezone.utc),
        }

        # Save the attempt
        self.assessment_repo.save_attempt(attempt_doc)

        # Update progress status - THIS IS THE KEY FIX
        self.progress_repo.update_assessment_status(
            user_id=user_id,
            course_slug=course_slug,
            module_id=module_id,
            score=score,
            passed=passed,
        )

        return {
            "attempt": attempt_doc,
            "passed": passed,
            "score": score,
            "total_questions": total_questions,
        }

    def get_assessment_history(
        self, user_id: str, course_slug: str, module_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get assessment attempt history."""
        return self.assessment_repo.get_attempts_history(
            user_id, course_slug, module_id
        )
