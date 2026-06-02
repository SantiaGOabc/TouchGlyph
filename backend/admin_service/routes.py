from flask import Blueprint, request, jsonify
from shared.auth import token_required, role_required
from shared.limiter import limiter
from shared.config import config
from .services import AdminService
from shared.schemas import (
    UserCreate, UserUpdate, ClassCreate, ClassUpdate,
    DeviceCreate, AssignStudentsRequest, AssignTeacherRequest
)

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
service = AdminService()

@admin_bp.route('/users', methods=['GET'])
@token_required
@role_required('admin')
def get_users():
    """
    List all users
    ---
    tags: [Admin - Users]
    responses:
      200: {description: Users list}
    """
    users = service.list_users()
    return jsonify({"users": users})

@admin_bp.route('/users', methods=['POST'])
@token_required
@role_required('admin')
@limiter.limit(config.RATE_LIMIT_AUTH)
def create_user():
    """
    Create a new user
    ---
    tags: [Admin - Users]
    parameters:
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {username: {type: string}, full_name: {type: string}, role: {type: string}, password: {type: string}}}
    responses:
      201: {description: User created}
      400: {description: Error}
    """
    data = UserCreate(**request.get_json())
    try:
        user_id = service.create_user(data.model_dump(), request.user_id)
        return jsonify({"message": "Usuario creado", "user_id": user_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@role_required('admin')
def update_user(user_id):
    """
    Update a user
    ---
    tags: [Admin - Users]
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        schema: UserUpdate
    responses:
      200: {description: User updated}
      404: {description: User not found}
    """
    data = UserUpdate(**request.get_json())
    success = service.update_user(user_id, data.model_dump(exclude_unset=True))
    if not success:
        return jsonify({"error": "Usuario no encontrado o sin cambios"}), 404
    return jsonify({"message": "Usuario actualizado"})

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_user(user_id):
    """
    Delete a user
    ---
    tags: [Admin - Users]
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
    responses:
      200: {description: User deleted}
      400: {description: Cannot delete self}
      404: {description: User not found}
    """
    try:
        success = service.delete_user(user_id, request.user_id)
        if not success:
            return jsonify({"error": "Usuario no encontrado"}), 404
        return jsonify({"message": "Usuario eliminado"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/teachers', methods=['GET'])
@token_required
@role_required('admin')
def get_teachers():
    """
    List all teachers
    ---
    tags: [Admin - Users]
    responses:
      200: {description: Teachers list}
    """
    teachers = service.list_teachers()
    return jsonify({"teachers": teachers})

@admin_bp.route('/classes', methods=['GET'])
@token_required
@role_required('admin')
def get_classes():
    """
    List all classes
    ---
    tags: [Admin - Classes]
    responses:
      200: {description: Classes list}
    """
    classes = service.list_classes()
    return jsonify({"classes": classes})

@admin_bp.route('/classes/<int:class_id>', methods=['GET'])
@token_required
@role_required('admin')
def get_class(class_id):
    """
    Get class details
    ---
    tags: [Admin - Classes]
    parameters:
      - name: class_id
        in: path
        type: integer
        required: true
    responses:
      200: {description: Class details}
      404: {description: Class not found}
    """
    cls = service.get_class(class_id)
    if not cls:
        return jsonify({"error": "Clase no encontrada"}), 404
    return jsonify(cls)

@admin_bp.route('/classes', methods=['POST'])
@token_required
@role_required('admin')
def create_class():
    """
    Create a class
    ---
    tags: [Admin - Classes]
    parameters:
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {name: {type: string}, description: {type: string}, teacher_id: {type: integer}}}
    responses:
      201: {description: Class created}
      400: {description: Error}
    """
    data = ClassCreate(**request.get_json())
    try:
        class_id = service.create_class(data.name, data.description, data.teacher_id)
        return jsonify({"message": "Clase creada", "class_id": class_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/classes/<int:class_id>', methods=['PUT'])
@token_required
@role_required('admin')
def update_class(class_id):
    """
    Update a class
    ---
    tags: [Admin - Classes]
    parameters:
      - name: class_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        schema: ClassUpdate
    responses:
      200: {description: Class updated}
      404: {description: Class not found}
    """
    data = ClassUpdate(**request.get_json())
    success = service.update_class(class_id, data.model_dump(exclude_unset=True))
    if not success:
        return jsonify({"error": "Clase no encontrada"}), 404
    return jsonify({"message": "Clase actualizada"})

@admin_bp.route('/classes/<int:class_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_class(class_id):
    """
    Delete a class
    ---
    tags: [Admin - Classes]
    parameters:
      - name: class_id
        in: path
        type: integer
        required: true
    responses:
      200: {description: Class deleted}
      404: {description: Class not found}
    """
    success = service.delete_class(class_id)
    if not success:
        return jsonify({"error": "Clase no encontrada"}), 404
    return jsonify({"message": "Clase eliminada"})

@admin_bp.route('/classes/<int:class_id>/students', methods=['POST'])
@token_required
@role_required('admin')
def add_students_to_class(class_id):
    """
    Add students to a class
    ---
    tags: [Admin - Classes]
    parameters:
      - name: class_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {student_ids: {type: array, items: {type: integer}}}}
    responses:
      200: {description: Students added}
    """
    data = AssignStudentsRequest(**request.get_json())
    added = service.add_students_to_class(class_id, data.student_ids)
    return jsonify({"message": f"{added} estudiantes agregados"})

@admin_bp.route('/classes/<int:class_id>/teacher', methods=['POST'])
@token_required
@role_required('admin')
def assign_teacher(class_id):
    """
    Assign a teacher to a class
    ---
    tags: [Admin - Classes]
    parameters:
      - name: class_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {teacher_id: {type: integer}}}
    responses:
      200: {description: Teacher assigned}
      404: {description: Class not found}
    """
    data = AssignTeacherRequest(**request.get_json())
    success = service.assign_teacher(class_id, data.teacher_id)
    if not success:
        return jsonify({"error": "Clase no encontrada"}), 404
    return jsonify({"message": "Profesor asignado"})

@admin_bp.route('/devices', methods=['GET'])
@token_required
@role_required('admin')
def get_devices():
    """
    List all devices
    ---
    tags: [Admin - Devices]
    responses:
      200: {description: Devices list}
    """
    devices = service.list_devices()
    return jsonify({"devices": devices})

@admin_bp.route('/devices', methods=['POST'])
@token_required
@role_required('admin')
def create_device():
    """
    Register a device
    ---
    tags: [Admin - Devices]
    parameters:
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {device_id: {type: string}, name: {type: string}}}
    responses:
      201: {description: Device created}
      400: {description: Error}
    """
    data = DeviceCreate(**request.get_json())
    try:
        service.create_device(data.device_id, data.name)
        return jsonify({"message": "Dispositivo creado", "device_id": data.device_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/devices/<device_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_device(device_id):
    """
    Delete a device
    ---
    tags: [Admin - Devices]
    parameters:
      - name: device_id
        in: path
        type: string
        required: true
    responses:
      200: {description: Device deleted}
      404: {description: Device not found}
    """
    success = service.delete_device(device_id)
    if not success:
        return jsonify({"error": "Dispositivo no encontrado"}), 404
    return jsonify({"message": "Dispositivo eliminado"})

@admin_bp.route('/lessons', methods=['GET'])
@token_required
@role_required('admin')
def get_lessons():
    """
    List all lessons
    ---
    tags: [Admin - Lessons]
    responses:
      200: {description: Lessons list}
    """
    lessons = service.list_lessons()
    return jsonify({"lessons": lessons})
