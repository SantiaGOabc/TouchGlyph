from shared.database import get_db_cursor, get_param_placeholder
from shared.utils import get_password_hash, verify_password
from datetime import datetime
import base64
import json
class UserRepository:

    @staticmethod
    def get_user_by_username(username: str):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"SELECT * FROM users WHERE username = {ph}", (username,))
            return cursor.fetchone()

    @staticmethod
    def get_user_by_id(user_id: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"SELECT id, username, full_name, role, created_at FROM users WHERE id = {ph}", (user_id,))
            return cursor.fetchone()

    @staticmethod
    def create_user(username: str, full_name: str, role: str, password: str, created_by: int = None):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            hashed = get_password_hash(password)
            cursor.execute(f"""
                INSERT INTO users (username, full_name, role, password, created_by, created_at, active)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, CURRENT_TIMESTAMP, 1)
            """, (username, full_name, role, hashed, created_by))
            return cursor.lastrowid

    @staticmethod
    def authenticate_user(username: str, password: str):
        user = UserRepository.get_user_by_username(username)
        if not user:
            return None
        if verify_password(password, user['password']):
            return user
        return None

    # ------------------ Face Recognition ------------------
    @staticmethod
    def get_face_encoding(user_id: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT face_image, face_encoding, created_at, updated_at
                FROM face_encodings
                WHERE user_id = {ph}
            """, (user_id,))
            return cursor.fetchone()

    @staticmethod
    def save_face_encoding(user_id: int, face_image_bytes: bytes, encoding: list):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"SELECT id FROM face_encodings WHERE user_id = {ph}", (user_id,))
            existing = cursor.fetchone()
            if existing:
                cursor.execute(f"""
                    UPDATE face_encodings
                    SET face_image = {ph}, face_encoding = {ph}, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = {ph}
                """, (face_image_bytes, json.dumps(encoding), user_id))
            else:
                cursor.execute(f"""
                    INSERT INTO face_encodings (user_id, face_image, face_encoding, created_at, updated_at)
                    VALUES ({ph}, {ph}, {ph}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (user_id, face_image_bytes, json.dumps(encoding)))
            return True

    @staticmethod
    def delete_face_encoding(user_id: int):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"DELETE FROM face_encodings WHERE user_id = {ph}", (user_id,))
            return cursor.rowcount > 0

    @staticmethod
    def get_all_face_encodings():
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"SELECT user_id, face_encoding FROM face_encodings")
            rows = cursor.fetchall()
            for row in rows:
                row['face_encoding'] = json.loads(row['face_encoding']) if isinstance(row['face_encoding'], str) else row['face_encoding']
            return rows