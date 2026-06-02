from shared.database import get_db_cursor, get_param_placeholder
from shared.utils import get_password_hash
from typing import Optional, List
class AdminRepository:
    
    # USUARIOS
    @staticmethod
    def get_all_teachers():
        with get_db_cursor() as cursor:
            cursor.execute("SELECT id, username, full_name FROM users WHERE role = 'teacher' AND active = 1")
            return cursor.fetchall()
        
    @staticmethod
    def get_all_users():
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT id, username, full_name, role, active, created_at
                FROM users
                ORDER BY id DESC
            """)
            return cursor.fetchall()

    @staticmethod
    def get_user_by_id(user_id: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"SELECT * FROM users WHERE id = {ph}", (user_id,))
            return cursor.fetchone()

    @staticmethod
    def create_user(username: str, full_name: str, role: str, password: str, created_by: int):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            hashed = get_password_hash(password)
            cursor.execute(f"""
                INSERT INTO users (username, full_name, role, password, created_by, created_at, active)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, CURRENT_TIMESTAMP, 1)
            """, (username, full_name, role, hashed, created_by))
            return cursor.lastrowid

    @staticmethod
    def update_user(user_id: int, **kwargs):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            fields = []
            values = []
            for key, value in kwargs.items():
                if value is not None:
                    if key == 'password':
                        value = get_password_hash(value)
                    fields.append(f"{key} = {ph}")
                    values.append(value)
            if not fields:
                return False
            values.append(user_id)
            sql = f"UPDATE users SET {', '.join(fields)} WHERE id = {ph}"
            cursor.execute(sql, values)
            return cursor.rowcount > 0

    @staticmethod
    def delete_user(user_id: int):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"DELETE FROM class_students WHERE student_id = {ph}", (user_id,))
            cursor.execute(f"UPDATE classes SET teacher_id = NULL WHERE teacher_id = {ph}", (user_id,))
            cursor.execute(f"DELETE FROM face_encodings WHERE user_id = {ph}", (user_id,))
            cursor.execute(f"DELETE FROM users WHERE id = {ph}", (user_id,))
            return cursor.rowcount > 0

    # CLASES
    @staticmethod
    def get_all_classes():
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT c.id, c.name, c.description, c.teacher_id,
                       u.full_name AS teacher_name,
                       COUNT(DISTINCT cs.student_id) AS student_count,
                       COUNT(DISTINCT cl.lesson_id) AS lesson_count
                FROM classes c
                LEFT JOIN users u ON c.teacher_id = u.id
                LEFT JOIN class_students cs ON c.id = cs.class_id
                LEFT JOIN class_lessons cl ON c.id = cl.class_id
                GROUP BY c.id
                ORDER BY c.id DESC
            """)
            return cursor.fetchall()

    @staticmethod
    def get_class_details(class_id: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT c.id, c.name, c.description, c.teacher_id,
                       u.full_name AS teacher_name, c.created_at
                FROM classes c
                LEFT JOIN users u ON c.teacher_id = u.id
                WHERE c.id = {ph}
            """, (class_id,))
            cls = cursor.fetchone()
            if not cls:
                return None
            cursor.execute(f"""
                SELECT u.id, u.username, u.full_name, cs.created_at AS enrolled_at
                FROM class_students cs
                JOIN users u ON cs.student_id = u.id
                WHERE cs.class_id = {ph}
                ORDER BY u.full_name
            """, (class_id,))
            cls['students'] = cursor.fetchall()
            return cls

    @staticmethod
    def create_class(name: str, description: Optional[str] = None, teacher_id: Optional[int] = None):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                INSERT INTO classes (name, description, teacher_id, created_at)
                VALUES ({ph}, {ph}, {ph}, CURRENT_TIMESTAMP)
            """, (name, description, teacher_id))
            return cursor.lastrowid

    @staticmethod
    def update_class(class_id: int, **kwargs):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            fields = []
            values = []
            for key, value in kwargs.items():
                if value is not None:
                    fields.append(f"{key} = {ph}")
                    values.append(value)
            if not fields:
                return False
            values.append(class_id)
            sql = f"UPDATE classes SET {', '.join(fields)} WHERE id = {ph}"
            cursor.execute(sql, values)
            return cursor.rowcount > 0

    @staticmethod
    def delete_class(class_id: int):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"DELETE FROM class_students WHERE class_id = {ph}", (class_id,))
            cursor.execute(f"DELETE FROM class_lessons WHERE class_id = {ph}", (class_id,))
            cursor.execute(f"DELETE FROM classes WHERE id = {ph}", (class_id,))
            return cursor.rowcount > 0

    @staticmethod
    def add_students_to_class(class_id: int, student_ids: List[int]):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            added = 0
            for sid in student_ids:
                cursor.execute(f"""
                    INSERT INTO class_students (class_id, student_id, created_at)
                    VALUES ({ph}, {ph}, CURRENT_TIMESTAMP)
                """, (class_id, sid))
                if cursor.rowcount > 0:
                    added += 1
            return added

    @staticmethod
    def assign_teacher_to_class(class_id: int, teacher_id: Optional[int]):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"UPDATE classes SET teacher_id = {ph} WHERE id = {ph}", (teacher_id, class_id))
            return cursor.rowcount > 0

    # DISPOSITIVOS
    @staticmethod
    def get_all_devices():
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM devices ORDER BY id")
            return cursor.fetchall()

    @staticmethod
    def create_device(device_id: str, name: str):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                INSERT INTO devices (id, name, last_seen)
                VALUES ({ph}, {ph}, CURRENT_TIMESTAMP)
            """, (device_id, name))
            return True

    @staticmethod
    def delete_device(device_id: str):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"DELETE FROM devices WHERE id = {ph}", (device_id,))
            return cursor.rowcount > 0

    # LECCIONES (ADMIN)
    @staticmethod
    def get_all_lessons():
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT l.id, l.title, l.description, l.difficulty, l.priority,
                       l.active, l.created_at,
                       COUNT(ls.id) AS step_count
                FROM lessons l
                LEFT JOIN lesson_steps ls ON l.id = ls.lesson_id
                GROUP BY l.id
                ORDER BY l.created_at DESC
            """)
            return cursor.fetchall()