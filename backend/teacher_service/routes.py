from flask import Blueprint, request, jsonify
from shared.auth import token_required, role_required
from shared.limiter import limiter
from shared.config import config
from .services import TeacherService
from shared.schemas import LessonCreate, LessonUpdate, AssignLessonRequest

teacher_bp = Blueprint('teacher', __name__, url_prefix='/api/teacher')
service = TeacherService()

@teacher_bp.route('/dashboard', methods=['GET'])
@token_required
@role_required('teacher', 'admin')
def dashboard():
    """
    Get teacher dashboard stats
    ---
    tags: [Teacher - Dashboard]
    responses:
      200: {description: Dashboard data}
    """
    data = service.get_dashboard(request.user_id)
    return jsonify(data)

@teacher_bp.route('/classes', methods=['GET'])
@token_required
@role_required('teacher', 'admin')
def get_my_classes():
    """
    Get classes assigned to the teacher
    ---
    tags: [Teacher - Classes]
    responses:
      200: {description: Classes list}
    """
    classes = service.get_teacher_classes(request.user_id)
    return jsonify({"classes": classes})

@teacher_bp.route('/student/<int:student_id>', methods=['GET'])
@token_required
@role_required('teacher', 'admin')
def student_detail(student_id):
    """
    Get student progress detail
    ---
    tags: [Teacher - Students]
    parameters:
      - name: student_id
        in: path
        type: integer
        required: true
    responses:
      200: {description: Student detail}
      404: {description: Student not found}
    """
    detail = service.get_student_detail(student_id)
    if not detail:
        return jsonify({"error": "Estudiante no encontrado"}), 404
    return jsonify(detail)

@teacher_bp.route('/lessons', methods=['GET'])
@token_required
@role_required('teacher', 'admin')
def list_lessons():
    """
    Get lessons for teacher's classes
    ---
    tags: [Teacher - Lessons]
    responses:
      200: {description: Lessons list}
    """
    teacher_id = request.user_id
    lessons = service.get_my_class_lessons(teacher_id)
    return jsonify({"lessons": lessons})

@teacher_bp.route('/lessons/available', methods=['GET'])
@token_required
@role_required('teacher', 'admin')
def available_lessons():
    """
    Get available lessons in the bank
    ---
    tags: [Teacher - Lessons]
    responses:
      200: {description: Available lessons}
    """
    teacher_id = request.user_id
    lessons = service.get_available_lessons(teacher_id)
    return jsonify({"lessons": lessons})

@teacher_bp.route('/lessons/<lesson_id>/unassign', methods=['DELETE'])
@token_required
@role_required('teacher', 'admin')
def unassign_lesson(lesson_id):
    """
    Unassign a lesson from all classes
    ---
    tags: [Teacher - Lessons]
    parameters:
      - name: lesson_id
        in: path
        type: string
        required: true
    responses:
      200: {description: Lesson unassigned}
      400: {description: Error}
    """
    success = service.unassign_lesson(request.user_id, lesson_id)
    if not success:
        return jsonify({"error": "No se pudo desasignar la lección"}), 400
    return jsonify({"message": "Lección desasignada de todas tus clases"})

@teacher_bp.route('/lessons', methods=['POST'])
@token_required
@role_required('teacher', 'admin')
@limiter.limit(config.RATE_LIMIT_AUTH)
def create_lesson():
    """
    Create a new lesson
    ---
    tags: [Teacher - Lessons]
    parameters:
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {title: {type: string}, description: {type: string}, difficulty: {type: string}, priority: {type: integer}, steps: {type: array}}}
    responses:
      201: {description: Lesson created}
      400: {description: Error}
    """
    data = LessonCreate(**request.get_json())
    try:
        lesson_id = service.create_lesson(data.model_dump())
        return jsonify({"message": "Lección creada", "lesson_id": lesson_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@teacher_bp.route('/lessons/<lesson_id>', methods=['GET'])
@token_required
@role_required('teacher', 'admin')
def get_lesson(lesson_id):
    """
    Get lesson details
    ---
    tags: [Teacher - Lessons]
    parameters:
      - name: lesson_id
        in: path
        type: string
        required: true
    responses:
      200: {description: Lesson data}
      404: {description: Lesson not found}
    """
    lesson_data = service.get_lesson(lesson_id)
    if not lesson_data:
        return jsonify({"error": "Lección no encontrada"}), 404
    return jsonify(lesson_data)

@teacher_bp.route('/lessons/<lesson_id>', methods=['PUT'])
@token_required
@role_required('teacher', 'admin')
def update_lesson(lesson_id):
    """
    Update a lesson
    ---
    tags: [Teacher - Lessons]
    parameters:
      - name: lesson_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        schema: LessonUpdate
    responses:
      200: {description: Lesson updated}
      404: {description: Lesson not found}
    """
    data = LessonUpdate(**request.get_json())
    success = service.update_lesson(lesson_id, data.model_dump(exclude_unset=True))
    if not success:
        return jsonify({"error": "Lección no encontrada"}), 404
    return jsonify({"message": "Lección actualizada"})

@teacher_bp.route('/lessons/<lesson_id>', methods=['DELETE'])
@token_required
@role_required('teacher', 'admin')
def delete_lesson(lesson_id):
    """
    Delete a lesson
    ---
    tags: [Teacher - Lessons]
    parameters:
      - name: lesson_id
        in: path
        type: string
        required: true
    responses:
      200: {description: Lesson deleted}
      404: {description: Lesson not found}
    """
    success = service.delete_lesson(lesson_id)
    if not success:
        return jsonify({"error": "Lección no encontrada"}), 404
    return jsonify({"message": "Lección eliminada"})

@teacher_bp.route('/lessons/<lesson_id>/assign', methods=['POST'])
@token_required
@role_required('teacher', 'admin')
def assign_lesson(lesson_id):
    """
    Assign a lesson to a class
    ---
    tags: [Teacher - Lessons]
    parameters:
      - name: lesson_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {class_id: {type: integer}}}
    responses:
      201: {description: Lesson assigned}
      400: {description: Error}
    """
    data = AssignLessonRequest(**request.get_json())
    success = service.assign_lesson_to_class(lesson_id, data.class_id, None)
    if not success:
        return jsonify({"error": "No se pudo asignar"}), 400
    return jsonify({"message": "Lección asignada a la clase"}), 201
