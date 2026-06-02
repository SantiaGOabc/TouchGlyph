from .repositories import AdminRepository
from shared.sanitize import sanitize_text
from typing import Optional, List

class AdminService:
    def __init__(self):
        self.repo = AdminRepository()

    # Usuarios
    def list_users(self):
        return self.repo.get_all_users()

    def create_user(self, data: dict, created_by: int):
        # Validaciones básicas
        if not data.get('username') or not data.get('password'):
            raise ValueError("Username y password son requeridos")
        return self.repo.create_user(
            username=sanitize_text(data['username']),
            full_name=sanitize_text(data.get('full_name', '')),
            role=data.get('role', 'student'),
            password=data['password'],
            created_by=created_by
        )

    def update_user(self, user_id: int, data: dict):
        # Evitar actualizar campos no permitidos
        allowed = {'username', 'full_name', 'role', 'password', 'active'}
        update_data = {k: v for k, v in data.items() if k in allowed and v is not None}
        return self.repo.update_user(user_id, **update_data)

    def delete_user(self, user_id: int, requesting_user_id: int = None):
        if requesting_user_id and user_id == requesting_user_id:
            raise ValueError("No puedes eliminarte a ti mismo")
        user = self.repo.get_user_by_id(user_id)
        if not user:
            return False
        if user['role'] == 'admin' and requesting_user_id:
            raise ValueError("No puedes eliminar a otro administrador")
        return self.repo.delete_user(user_id)
    
    def list_teachers(self):
        return self.repo.get_all_teachers()

    # Clases
    def list_classes(self):
        return self.repo.get_all_classes()

    def get_class(self, class_id: int):
        return self.repo.get_class_details(class_id)

    def create_class(self, name: str, description: Optional[str], teacher_id: Optional[int]):
        if not name:
            raise ValueError("El nombre de la clase es requerido")
        return self.repo.create_class(sanitize_text(name), sanitize_text(description), teacher_id)

    def update_class(self, class_id: int, data: dict):
        allowed = {'name', 'description', 'teacher_id'}
        update_data = {k: v for k, v in data.items() if k in allowed}
        return self.repo.update_class(class_id, **update_data)

    def delete_class(self, class_id: int):
        return self.repo.delete_class(class_id)

    def add_students_to_class(self, class_id: int, student_ids: List[int]):
        if not student_ids:
            return 0
        return self.repo.add_students_to_class(class_id, student_ids)

    def assign_teacher(self, class_id: int, teacher_id: Optional[int]):
        return self.repo.assign_teacher_to_class(class_id, teacher_id)

    # Dispositivos
    def list_devices(self):
        return self.repo.get_all_devices()

    def create_device(self, device_id: str, name: str):
        if not device_id:
            raise ValueError("Device ID es requerido")
        return self.repo.create_device(sanitize_text(device_id), sanitize_text(name or device_id))

    def delete_device(self, device_id: str):
        return self.repo.delete_device(device_id)

    # Lecciones
    def list_lessons(self):
        return self.repo.get_all_lessons()