from user_service.repositories import UserRepository
from flask import Blueprint, request, jsonify, make_response
from shared.auth import token_required, role_required, set_token_cookie, clear_token_cookie
from shared.limiter import limiter
from shared.config import config
from .services import UserService
from shared.schemas import (
    UserCreate, LoginRequest, TokenResponse,
    FaceRegisterRequest, FaceLoginRequest, FaceStatusResponse
)

user_bp = Blueprint('user', __name__, url_prefix='/api')
service = UserService()


@user_bp.route('/register', methods=['POST'])
@limiter.limit(config.RATE_LIMIT_AUTH)
def register():
    """
    Register a new user
    ---
    tags: [Auth]
    responses:
      201: {description: User created}
      400: {description: Validation error}
    """
    data = UserCreate(**request.get_json())
    result, error = service.register_user(
        username=data.username,
        full_name=data.full_name,
        role=data.role,
        password=data.password,
        created_by=data.created_by
    )
    if error:
        return jsonify({"detail": error}), 400
    response = make_response(jsonify(result), 201)
    set_token_cookie(response, result['access_token'])
    return response


@user_bp.route('/login', methods=['POST'])
@limiter.limit(config.RATE_LIMIT_AUTH)
def login():
    """
    Login with username and password
    ---
    tags: [Auth]
    responses:
      200: {description: Token returned}
      401: {description: Invalid credentials}
    """
    data = LoginRequest(**request.get_json())
    result, error = service.login_password(data.username, data.password)
    if error:
        return jsonify({"detail": error}), 401
    response = make_response(jsonify(result))
    set_token_cookie(response, result['access_token'])
    return response


@user_bp.route('/face/login', methods=['POST'])
@limiter.limit(config.RATE_LIMIT_AUTH)
def login_face():
    """
    Login with face recognition
    ---
    tags: [Face]
    responses:
      200: {description: Token returned}
      401: {description: Face not recognized}
    """
    data = FaceLoginRequest(**request.get_json())
    result, error = service.login_face(data.image_base64)
    if error:
        return jsonify({"detail": error}), 401
    response = make_response(jsonify(result))
    set_token_cookie(response, result['access_token'])
    return response


@user_bp.route('/logout', methods=['POST'])
def logout():
    """Clear the auth cookie."""
    response = make_response(jsonify({"success": True}))
    clear_token_cookie(response)
    return response


@user_bp.route('/face/register', methods=['POST'])
@token_required
@limiter.limit(config.RATE_LIMIT_AUTH)
def register_face():
    """
    Register face for a user
    ---
    tags: [Face]
    responses:
      200: {description: Face registered}
      403: {description: Permission denied}
    """
    data = FaceRegisterRequest(**request.get_json())
    if data.user_id != request.user_id and request.user_role != 'admin':
        return jsonify({"detail": "No puedes registrar el rostro de otro usuario"}), 403
    success, error = service.register_face(data.user_id, data.image_base64)
    if not success:
        return jsonify({"detail": error or "Error al registrar rostro"}), 400
    return jsonify({"success": True, "message": "Rostro registrado exitosamente", "user_id": data.user_id})


@user_bp.route('/face/status/<int:user_id>', methods=['GET'])
@token_required
def face_status(user_id):
    """
    Check if a user has a face registered
    ---
    tags: [Face]
    responses:
      200: {description: Face status returned}
    """
    has_face = service.has_face_registered(user_id)
    face_data = None
    if has_face:
        face_record = service.user_repo.get_face_encoding(user_id)
        if face_record:
            face_data = {
                "created_at": face_record['created_at'].isoformat() if face_record['created_at'] else None,
                "updated_at": face_record['updated_at'].isoformat() if face_record['updated_at'] else None
            }
    return jsonify({"has_face_registered": has_face, "face_data": face_data})


@user_bp.route('/face/image/<int:user_id>', methods=['GET'])
@token_required
def get_face_image(user_id):
    """
    Get face image of a user
    ---
    tags: [Face]
    responses:
      200: {description: Face image returned}
      403: {description: Permission denied}
      404: {description: No image registered}
    """
    image_b64, error = service.get_face_image(user_id, request.user_id, request.user_role)
    if error:
        return jsonify({"detail": error}), 404 if "No hay" in error else 403
    return jsonify({"user_id": user_id, "image_base64": image_b64})


@user_bp.route('/face/<int:user_id>', methods=['DELETE'])
@token_required
def delete_face(user_id):
    """
    Delete face registration of a user
    ---
    tags: [Face]
    responses:
      200: {description: Face deleted}
      403: {description: Permission denied}
      404: {description: Face not found}
    """
    success, error = service.delete_face(user_id, request.user_id, request.user_role)
    if not success:
        return jsonify({"detail": error}), 404 if "No se encontró" in error else 403
    return jsonify({"success": True, "message": "Rostro eliminado exitosamente"})


@user_bp.route('/users', methods=['POST'])
@token_required
@role_required('admin')
def create_user():
    """
    Create a user (admin only)
    ---
    tags: [Admin]
    responses:
      201: {description: User created}
      400: {description: Validation error}
    """
    data = UserCreate(**request.get_json())
    result, error = service.register_user(
        username=data.username,
        full_name=data.full_name,
        role=data.role,
        password=data.password,
        created_by=request.user_id
    )
    if error:
        return jsonify({"detail": error}), 400
    return jsonify(result), 201


@user_bp.route('/me', methods=['GET'])
@token_required
def get_me():
    """
    Get current user profile
    ---
    tags: [User]
    responses:
      200: {description: User profile}
      404: {description: User not found}
    """
    user = UserRepository.get_user_by_id(request.user_id)
    if not user:
        return jsonify({"detail": "Usuario no encontrado"}), 404
    return jsonify({
        "id": user['id'],
        "username": user['username'],
        "full_name": user['full_name'],
        "role": user['role']
    })
