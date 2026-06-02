from .repositories import UserRepository
from .face_service import FaceRecognitionService
from shared.auth import create_access_token
from shared.sanitize import sanitize_text
import base64

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.face_service = FaceRecognitionService()

    def register_user(self, username: str, full_name: str, role: str, password: str, created_by: int = None):
        # Verificar si el usuario ya existe
        existing = self.user_repo.get_user_by_username(username)
        if existing:
            return None, "El nombre de usuario ya está registrado"
        user_id = self.user_repo.create_user(
            sanitize_text(username), sanitize_text(full_name), role, password, created_by
        )
        user = self.user_repo.get_user_by_id(user_id)
        token = create_access_token({"sub": user['id'], "role": user['role']})
        return {"access_token": token, "token_type": "bearer", "user": user}, None

    def login_password(self, username: str, password: str):
        user = self.user_repo.authenticate_user(username, password)
        if not user:
            return None, "Credenciales inválidas"
        token = create_access_token({"sub": user['id'], "role": user['role']})
        return {"access_token": token, "token_type": "bearer", "user": {
            "id": user['id'],
            "username": user['username'],
            "full_name": user['full_name'],
            "role": user['role']
        }}, None

    def login_face(self, image_base64: str):
        query_encoding = self.face_service.extract_face_encoding(image_base64)
        if query_encoding is None:
            return None, "No se detectó un rostro en la imagen"
        stored_encodings = self.user_repo.get_all_face_encodings()
        if not stored_encodings:
            return None, "No hay rostros registrados en el sistema"
        user_id = self.face_service.find_matching_user(query_encoding, stored_encodings)
        if user_id is None:
            return None, "Rostro no reconocido"
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "Usuario no encontrado"
        token = create_access_token({"sub": user['id'], "role": user['role']})
        return {"access_token": token, "token_type": "bearer", "user": user}, None

    def register_face(self, user_id: int, image_base64: str):
        encoding = self.face_service.extract_face_encoding(image_base64)
        if encoding is None:
            return False, "No se pudo extraer características faciales"
        image_bytes = base64.b64decode(image_base64)
        success = self.user_repo.save_face_encoding(user_id, image_bytes, encoding)
        return success, None if success else "Error al guardar en base de datos"

    def has_face_registered(self, user_id: int):
        face = self.user_repo.get_face_encoding(user_id)
        return face is not None

    def get_face_image(self, user_id: int, requester_id: int, requester_role: str):
        # Verificar permiso: solo el propio usuario o admin
        if requester_id != user_id and requester_role != 'admin':
            return None, "Permiso denegado"
        face = self.user_repo.get_face_encoding(user_id)
        if not face or not face['face_image']:
            return None, "No hay imagen registrada"
        return base64.b64encode(face['face_image']).decode('utf-8'), None

    def delete_face(self, user_id: int, requester_id: int, requester_role: str):
        if requester_id != user_id and requester_role != 'admin':
            return False, "Permiso denegado"
        success = self.user_repo.delete_face_encoding(user_id)
        return success, None if success else "No se encontró registro facial"