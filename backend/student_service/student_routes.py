from flask import Blueprint, request, jsonify
from shared.auth import token_required, role_required
from .student_service import StudentService
from shared.schemas import (
    StartSessionRequest, SubmitAnswerRequest,
    LessonListResponse, SessionPromptResponse, SubmitResponse
)

student_bp = Blueprint('student', __name__, url_prefix='/api/student')
service = StudentService()

@student_bp.route('/lessons', methods=['GET'])
@token_required
@role_required('student')
def list_lessons():
    """
    List lessons for the current student
    ---
    tags: [Student]
    parameters:
      - name: show_completed
        in: query
        type: boolean
        required: false
    responses:
      200: {description: Lessons list}
    """
    show_completed = request.args.get('show_completed', 'false').lower() == 'true'
    data = service.get_student_lessons(request.user_id, show_completed)
    return jsonify(data)

@student_bp.route('/start-session', methods=['POST'])
@token_required
@role_required('student')
def start_session():
    """
    Start a new learning session
    ---
    tags: [Student]
    parameters:
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {lesson_id: {type: string}}}
    responses:
      200: {description: Session started}
    """
    req_data = StartSessionRequest(**request.get_json())
    session_id = service.begin_session(request.user_id, req_data.lesson_id)
    return jsonify({"session_id": session_id})

@student_bp.route('/session/<session_id>/prompt', methods=['GET'])
@token_required
@role_required('student')
def get_prompt(session_id):
    """
    Get the next prompt for a session
    ---
    tags: [Student]
    parameters:
      - name: session_id
        in: path
        type: string
        required: true
    responses:
      200: {description: Prompt data}
      404: {description: Session not found}
    """
    data, error = service.get_next_prompt(session_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(data)

@student_bp.route('/session/<session_id>/submit', methods=['POST'])
@token_required
@role_required('student')
def submit_answer(session_id):
    """
    Submit an answer for the current step
    ---
    tags: [Student]
    parameters:
      - name: session_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {answer: {type: string}}}
    responses:
      200: {description: Result}
    """
    req_data = SubmitAnswerRequest(**request.get_json())
    result, status_code = service.submit_answer(session_id, req_data.answer)
    return jsonify(result), status_code

@student_bp.route('/session/<session_id>/skip', methods=['POST'])
@token_required
@role_required('student')
def skip_step(session_id):
    """
    Skip the current step in a session
    ---
    tags: [Student]
    parameters:
      - name: session_id
        in: path
        type: string
        required: true
    responses:
      200: {description: Step skipped}
    """
    result, status_code = service.skip_step(session_id)
    return jsonify(result), status_code
