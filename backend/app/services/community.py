from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from pymongo import DESCENDING, ASCENDING
from pymongo.database import Database

from ..config import get_settings
from .common import get_mongo_client


def _get_db() -> Database:

    settings = get_settings()
    client = get_mongo_client()
    if client is None:
        raise RuntimeError("MongoDB client not initialized")
    return client[settings.mongodb_db_name]


def _question_to_dict(
    question: Dict[str, Any], user_id: Optional[str] = None
) -> Dict[str, Any]:

    result = {
        "id": str(question["_id"]),
        "title": question["title"],
        "content": question["content"],
        "tags": question.get("tags", []),
        "author": {
            "id": question["author_id"],
            "email": question["author_email"],
            "full_name": question.get("author_name"),
        },
        "upvotes": question.get("upvotes", 0),
        "downvotes": question.get("downvotes", 0),
        "view_count": question.get("view_count", 0),
        "answer_count": question.get("answer_count", 0),
        "comment_count": question.get("comment_count", 0),
        "image_url": question.get("image_url"),
        "image_thumbnail_url": question.get("image_thumbnail_url"),
        "created_at": question["created_at"],
        "updated_at": question.get("updated_at"),
        "user_vote": None,
    }

    if user_id and "votes" in question:
        user_vote = question["votes"].get(user_id)
        result["user_vote"] = user_vote

    return result


def _answer_to_dict(
    answer: Dict[str, Any], user_id: Optional[str] = None
) -> Dict[str, Any]:
    result = {
        "id": str(answer["_id"]),
        "question_id": str(answer["question_id"]),
        "content": answer["content"],
        "author": {
            "id": answer["author_id"],
            "email": answer["author_email"],
            "full_name": answer.get("author_name"),
        },
        "upvotes": answer.get("upvotes", 0),
        "downvotes": answer.get("downvotes", 0),
        "is_accepted": answer.get("is_accepted", False),
        "created_at": answer["created_at"],
        "updated_at": answer.get("updated_at"),
        "user_vote": None,
    }

    if user_id and "votes" in answer:
        user_vote = answer["votes"].get(user_id)
        result["user_vote"] = user_vote

    return result


def _comment_to_dict(
    comment: Dict[str, Any], user_id: Optional[str] = None
) -> Dict[str, Any]:

    result = {
        "id": str(comment["_id"]),
        "question_id": str(comment["question_id"]),
        "content": comment["content"],
        "author": {
            "id": comment["author_id"],
            "email": comment["author_email"],
            "full_name": comment.get("author_name"),
        },
        "upvotes": comment.get("upvotes", 0),
        "downvotes": comment.get("downvotes", 0),
        "created_at": comment["created_at"],
        "updated_at": comment.get("updated_at"),
        "user_vote": None,
        "parent_id": str(comment["parent_id"]) if comment.get("parent_id") else None,
        "replies": [],
    }

    if user_id and "votes" in comment:
        user_vote = comment["votes"].get(user_id)
        result["user_vote"] = user_vote

    return result


def create_question(
    title: str,
    content: str,
    tags: List[str],
    author_id: str,
    author_email: str,
    author_name: Optional[str] = None,
    image_url: Optional[str] = None,
    image_thumbnail_url: Optional[str] = None,
) -> str:

    db = _get_db()
    settings = get_settings()

    question_doc = {
        "title": title,
        "content": content,
        "tags": tags,
        "author_id": author_id,
        "author_email": author_email,
        "author_name": author_name,
        "upvotes": 0,
        "downvotes": 0,
        "view_count": 0,
        "answer_count": 0,
        "comment_count": 0,
        "votes": {},
        "image_url": image_url,
        "image_thumbnail_url": image_thumbnail_url,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None,
    }

    result = db[settings.mongodb_questions_collection].insert_one(question_doc)
    return str(result.inserted_id)


def get_question(
    question_id: str, user_id: Optional[str] = None, increment_view: bool = True
) -> Optional[Dict[str, Any]]:

    db = _get_db()
    settings = get_settings()

    try:
        obj_id = ObjectId(question_id)
    except Exception:
        return None

    if increment_view:
        db[settings.mongodb_questions_collection].update_one(
            {"_id": obj_id}, {"$inc": {"view_count": 1}}
        )

    question = db[settings.mongodb_questions_collection].find_one({"_id": obj_id})

    if not question:
        return None

    return _question_to_dict(question, user_id)


def list_questions(
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "newest",
    tag: Optional[str] = None,
    search: Optional[str] = None,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:

    db = _get_db()
    settings = get_settings()

    query: Dict[str, Any] = {}

    if tag:
        query["tags"] = tag

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]

    sort_field = "created_at"
    sort_direction = DESCENDING

    if sort_by == "oldest":
        sort_direction = ASCENDING
    elif sort_by == "most_voted":
        sort_field = "upvotes"
    elif sort_by == "most_viewed":
        sort_field = "view_count"
    elif sort_by == "most_answered":
        sort_field = "answer_count"

    total = db[settings.mongodb_questions_collection].count_documents(query)

    skip = (page - 1) * page_size
    cursor = (
        db[settings.mongodb_questions_collection]
        .find(query)
        .sort(sort_field, sort_direction)
        .skip(skip)
        .limit(page_size)
    )

    questions = [_question_to_dict(q, user_id) for q in cursor]

    total_pages = (total + page_size - 1) // page_size

    return {
        "questions": questions,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def update_question(
    question_id: str,
    author_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    tags: Optional[List[str]] = None,
    image_url: Optional[str] = None,
    image_thumbnail_url: Optional[str] = None,
) -> bool:

    db = _get_db()
    settings = get_settings()

    try:
        obj_id = ObjectId(question_id)
    except Exception:
        return False

    question = db[settings.mongodb_questions_collection].find_one({"_id": obj_id})
    if not question or question["author_id"] != author_id:
        return False

    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

    if title is not None:
        update_fields["title"] = title
    if content is not None:
        update_fields["content"] = content
    if tags is not None:
        update_fields["tags"] = tags
    if image_url is not None:
        update_fields["image_url"] = image_url
    if image_thumbnail_url is not None:
        update_fields["image_thumbnail_url"] = image_thumbnail_url

    result = db[settings.mongodb_questions_collection].update_one(
        {"_id": obj_id}, {"$set": update_fields}
    )

    return result.modified_count > 0


def delete_question(question_id: str, author_id: str) -> bool:

    db = _get_db()
    settings = get_settings()

    try:
        obj_id = ObjectId(question_id)
    except Exception:
        return False

    result = db[settings.mongodb_questions_collection].delete_one(
        {
            "_id": obj_id,
            "author_id": author_id,
        }
    )

    if result.deleted_count > 0:
        db[settings.mongodb_answers_collection].delete_many({"question_id": obj_id})
        return True

    return False


def vote_question(question_id: str, user_id: str, vote_type: int) -> bool:

    db = _get_db()
    settings = get_settings()

    try:
        obj_id = ObjectId(question_id)
    except Exception:
        return False

    question = db[settings.mongodb_questions_collection].find_one({"_id": obj_id})
    if not question:
        return False

    votes = question.get("votes", {})
    old_vote = votes.get(user_id, 0)

    upvote_change = 0
    downvote_change = 0

    if old_vote == 1:
        upvote_change = -1
    elif old_vote == -1:
        downvote_change = -1

    if vote_type == 1:
        upvote_change += 1
    elif vote_type == -1:
        downvote_change += 1

    update_op: Dict[str, Any] = {}

    if vote_type == 0:
        update_op["$unset"] = {f"votes.{user_id}": ""}
    else:
        update_op["$set"] = {f"votes.{user_id}": vote_type}

    if upvote_change != 0 or downvote_change != 0:
        update_op["$inc"] = {}
        if upvote_change != 0:
            update_op["$inc"]["upvotes"] = upvote_change
        if downvote_change != 0:
            update_op["$inc"]["downvotes"] = downvote_change

    db[settings.mongodb_questions_collection].update_one({"_id": obj_id}, update_op)
    return True


def create_answer(
    question_id: str,
    content: str,
    author_id: str,
    author_email: str,
    author_name: Optional[str] = None,
) -> Optional[str]:

    db = _get_db()
    settings = get_settings()

    try:
        q_obj_id = ObjectId(question_id)
    except Exception:
        return None

    question = db[settings.mongodb_questions_collection].find_one({"_id": q_obj_id})
    if not question:
        return None

    answer_doc = {
        "question_id": q_obj_id,
        "content": content,
        "author_id": author_id,
        "author_email": author_email,
        "author_name": author_name,
        "upvotes": 0,
        "downvotes": 0,
        "is_accepted": False,
        "votes": {},
        "created_at": datetime.now(timezone.utc),
        "updated_at": None,
    }

    result = db[settings.mongodb_answers_collection].insert_one(answer_doc)

    db[settings.mongodb_questions_collection].update_one(
        {"_id": q_obj_id}, {"$inc": {"answer_count": 1}}
    )

    return str(result.inserted_id)


def get_answers_for_question(
    question_id: str, user_id: Optional[str] = None
) -> List[Dict[str, Any]]:

    db = _get_db()
    settings = get_settings()

    try:
        q_obj_id = ObjectId(question_id)
    except Exception:
        return []

    cursor = db[settings.mongodb_answers_collection].find({"question_id": q_obj_id})

    answers = list(cursor)

    answers.sort(key=lambda a: (not a.get("is_accepted", False), -a.get("upvotes", 0)))

    return [_answer_to_dict(a, user_id) for a in answers]


def update_answer(
    answer_id: str,
    author_id: str,
    content: str,
) -> bool:

    db = _get_db()
    settings = get_settings()

    try:
        obj_id = ObjectId(answer_id)
    except Exception:
        return False

    result = db[settings.mongodb_answers_collection].update_one(
        {"_id": obj_id, "author_id": author_id},
        {"$set": {"content": content, "updated_at": datetime.now(timezone.utc)}},
    )

    return result.modified_count > 0


def delete_answer(answer_id: str, author_id: str) -> bool:

    db = _get_db()
    settings = get_settings()

    try:
        obj_id = ObjectId(answer_id)
    except Exception:
        return False

    answer = db[settings.mongodb_answers_collection].find_one(
        {
            "_id": obj_id,
            "author_id": author_id,
        }
    )

    if not answer:
        return False

    result = db[settings.mongodb_answers_collection].delete_one({"_id": obj_id})

    if result.deleted_count > 0:
        db[settings.mongodb_questions_collection].update_one(
            {"_id": answer["question_id"]}, {"$inc": {"answer_count": -1}}
        )
        return True

    return False


def accept_answer(question_id: str, answer_id: str, author_id: str) -> bool:

    db = _get_db()
    settings = get_settings()

    try:
        q_obj_id = ObjectId(question_id)
        a_obj_id = ObjectId(answer_id)
    except Exception:
        return False

    question = db[settings.mongodb_questions_collection].find_one({"_id": q_obj_id})
    if not question or question["author_id"] != author_id:
        return False

    db[settings.mongodb_answers_collection].update_many(
        {"question_id": q_obj_id}, {"$set": {"is_accepted": False}}
    )

    result = db[settings.mongodb_answers_collection].update_one(
        {"_id": a_obj_id, "question_id": q_obj_id}, {"$set": {"is_accepted": True}}
    )

    return result.modified_count > 0


def vote_answer(answer_id: str, user_id: str, vote_type: int) -> bool:

    db = _get_db()
    settings = get_settings()

    try:
        obj_id = ObjectId(answer_id)
    except Exception:
        return False

    answer = db[settings.mongodb_answers_collection].find_one({"_id": obj_id})
    if not answer:
        return False

    votes = answer.get("votes", {})
    old_vote = votes.get(user_id, 0)

    upvote_change = 0
    downvote_change = 0

    if old_vote == 1:
        upvote_change = -1
    elif old_vote == -1:
        downvote_change = -1

    if vote_type == 1:
        upvote_change += 1
    elif vote_type == -1:
        downvote_change += 1

    update_op: Dict[str, Any] = {}

    if vote_type == 0:
        update_op["$unset"] = {f"votes.{user_id}": ""}
    else:
        update_op["$set"] = {f"votes.{user_id}": vote_type}

    if upvote_change != 0 or downvote_change != 0:
        update_op["$inc"] = {}
        if upvote_change != 0:
            update_op["$inc"]["upvotes"] = upvote_change
        if downvote_change != 0:
            update_op["$inc"]["downvotes"] = downvote_change

    db[settings.mongodb_answers_collection].update_one({"_id": obj_id}, update_op)
    return True


def get_popular_tags(limit: int = 20) -> List[Dict[str, Any]]:

    db = _get_db()
    settings = get_settings()

    pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
        {"$project": {"tag": "$_id", "count": 1, "_id": 0}},
    ]

    results = list(db[settings.mongodb_questions_collection].aggregate(pipeline))
    return results


def create_comment(
    question_id: str,
    content: str,
    author_id: str,
    author_email: str,
    author_name: Optional[str] = None,
    parent_id: Optional[str] = None,
) -> str:

    db = _get_db()
    settings = get_settings()

    question = db[settings.mongodb_questions_collection].find_one(
        {"_id": ObjectId(question_id)}
    )
    if not question:
        raise ValueError("Question not found")

    comment_doc = {
        "question_id": ObjectId(question_id),
        "content": content,
        "author_id": author_id,
        "author_email": author_email,
        "author_name": author_name,
        "parent_id": ObjectId(parent_id) if parent_id else None,
        "upvotes": 0,
        "downvotes": 0,
        "votes": {},
        "created_at": datetime.now(timezone.utc),
    }

    result = db[settings.mongodb_comments_collection].insert_one(comment_doc)

    db[settings.mongodb_questions_collection].update_one(
        {"_id": ObjectId(question_id)}, {"$inc": {"comment_count": 1}}
    )

    return str(result.inserted_id)


def get_question_comments(
    question_id: str,
    user_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:

    db = _get_db()
    settings = get_settings()

    all_comments = list(
        db[settings.mongodb_comments_collection]
        .find({"question_id": ObjectId(question_id)})
        .sort("created_at", ASCENDING)
    )

    comment_dict_list = [_comment_to_dict(comment, user_id) for comment in all_comments]

    comment_map = {comment["id"]: comment for comment in comment_dict_list}

    root_comments = []

    for comment in comment_dict_list:
        if comment["parent_id"]:
            parent = comment_map.get(comment["parent_id"])
            if parent:
                parent["replies"].append(comment)
        else:
            root_comments.append(comment)

    return root_comments[offset : offset + limit]


def update_comment(comment_id: str, content: str, user_id: str) -> bool:

    db = _get_db()
    settings = get_settings()

    obj_id = ObjectId(comment_id)

    comment = db[settings.mongodb_comments_collection].find_one({"_id": obj_id})
    if not comment:
        raise ValueError("Comment not found")

    if comment["author_id"] != user_id:
        raise ValueError("Not authorized to update this comment")

    update_result = db[settings.mongodb_comments_collection].update_one(
        {"_id": obj_id},
        {
            "$set": {
                "content": content,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return update_result.modified_count > 0


def delete_comment(comment_id: str, user_id: str) -> bool:

    db = _get_db()
    settings = get_settings()

    obj_id = ObjectId(comment_id)

    comment = db[settings.mongodb_comments_collection].find_one({"_id": obj_id})
    if not comment:
        raise ValueError("Comment not found")

    if comment["author_id"] != user_id:
        raise ValueError("Not authorized to delete this comment")

    delete_result = db[settings.mongodb_comments_collection].delete_one({"_id": obj_id})

    if delete_result.deleted_count > 0:
        db[settings.mongodb_questions_collection].update_one(
            {"_id": comment["question_id"]}, {"$inc": {"comment_count": -1}}
        )
        return True

    return False


def vote_comment(comment_id: str, user_id: str, vote_type: int) -> bool:

    db = _get_db()
    settings = get_settings()

    obj_id = ObjectId(comment_id)

    comment = db[settings.mongodb_comments_collection].find_one({"_id": obj_id})
    if not comment:
        raise ValueError("Comment not found")

    current_vote = comment.get("votes", {}).get(user_id, 0)

    upvote_change = 0
    downvote_change = 0

    if current_vote == 1:
        upvote_change = -1
    elif current_vote == -1:
        downvote_change = -1

    if vote_type == 1:
        upvote_change += 1
    elif vote_type == -1:
        downvote_change += 1

    update_op = {}

    if vote_type == 0:
        update_op["$unset"] = {f"votes.{user_id}": ""}
    else:
        update_op["$set"] = {f"votes.{user_id}": vote_type}

    if upvote_change != 0 or downvote_change != 0:
        update_op["$inc"] = {}
        if upvote_change != 0:
            update_op["$inc"]["upvotes"] = upvote_change
        if downvote_change != 0:
            update_op["$inc"]["downvotes"] = downvote_change

    db[settings.mongodb_comments_collection].update_one({"_id": obj_id}, update_op)
    return True
