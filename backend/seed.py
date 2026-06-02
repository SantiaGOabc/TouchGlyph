from shared.config import config
from shared.schema import create_tables
from shared.database import get_db_cursor, get_param_placeholder
from shared.utils import get_password_hash

PASSWORD = "123456"

lessons_data = [
    {
        "id": "lesson-a",
        "title": "Letra A",
        "description": "Aprender el patrón Braille de la letra A",
        "difficulty": "beginner",
        "steps": [
            {"step_index": 0, "type": "input", "target": "a", "prompt": "Escribe la letra A (punto 1 arriba a la izquierda)", "hint": "Es solo el punto superior izquierdo", "max_attempts": 3},
            {"step_index": 1, "type": "input", "target": "a", "prompt": "Repite: letra A", "hint": "Mismo patrón, punto 1", "max_attempts": 3},
        ],
    },
    {
        "id": "lesson-b",
        "title": "Letra B",
        "description": "Aprender el patrón Braille de la letra B",
        "difficulty": "beginner",
        "steps": [
            {"step_index": 0, "type": "input", "target": "b", "prompt": "Escribe la letra B (puntos 1 y 2 arriba)", "hint": "Son los dos puntos superiores", "max_attempts": 3},
        ],
    },
    {
        "id": "lesson-i",
        "title": "Letra I",
        "description": "Lectura y escritura de la letra I",
        "difficulty": "beginner",
        "steps": [
            {"step_index": 0, "type": "read", "target": "i", "prompt": "Esta es la letra I. Obsérvala en el display Braille y presiona Enter para continuar.", "hint": "La letra I son los puntos 2 y 4 (lado derecho)", "max_attempts": 1},
            {"step_index": 1, "type": "input", "target": "i", "prompt": "Escribe la letra I que acabas de ver en el display", "hint": "Puntos 2 y 4, solo el lado derecho", "max_attempts": 3},
        ],
    },
    {
        "id": "lesson-j",
        "title": "Letra J",
        "description": "Lectura y escritura de la letra J",
        "difficulty": "beginner",
        "steps": [
            {"step_index": 0, "type": "read", "target": "j", "prompt": "Esta es la letra J. Obsérvala en el display Braille y presiona Enter para continuar.", "hint": "La letra J son los puntos 2, 4 y 5", "max_attempts": 1},
            {"step_index": 1, "type": "input", "target": "j", "prompt": "Escribe la letra J que acabas de ver en el display", "hint": "Puntos 2, 4 y 5", "max_attempts": 3},
        ],
    },
]


def seed():
    ph = get_param_placeholder()
    create_tables()

    with get_db_cursor(commit=True) as cursor:
        # Deshabilitar FK checks solo para MySQL (necesario para TRUNCATE)
        if config.DB_TYPE == "mysql":
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")

        tables = ["attempts", "sessions", "student_progress", "class_lessons",
                  "class_students", "lesson_steps", "lessons", "classes",
                  "face_encodings", "devices", "users"]
        for t in tables:
            if config.DB_TYPE == "mysql":
                cursor.execute(f"TRUNCATE TABLE {t}")
            else:
                cursor.execute(f"DELETE FROM {t}")

        if config.DB_TYPE == "mysql":
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

        # Insertar usuarios en orden (cada uno puede referenciar al anterior)
        cursor.execute(
            f"INSERT INTO users (username, full_name, role, password) VALUES ({ph},{ph},{ph},{ph})",
            ("admin", "Administrador", "admin", get_password_hash(PASSWORD)),
        )
        cursor.execute(f"SELECT id FROM users WHERE username = {ph}", ("admin",))
        admin_id = cursor.fetchone()["id"]

        cursor.execute(
            f"INSERT INTO users (username, full_name, role, password, created_by) VALUES ({ph},{ph},{ph},{ph},{ph})",
            ("teacher1", "Profesor Principal", "teacher", get_password_hash(PASSWORD), admin_id),
        )
        cursor.execute(f"SELECT id FROM users WHERE username = {ph}", ("teacher1",))
        teacher_id = cursor.fetchone()["id"]

        cursor.execute(
            f"INSERT INTO users (username, full_name, role, password, created_by) VALUES ({ph},{ph},{ph},{ph},{ph})",
            ("student1", "Estudiante Uno", "student", get_password_hash(PASSWORD), teacher_id),
        )
        cursor.execute(f"SELECT id FROM users WHERE username = {ph}", ("student1",))
        student1_id = cursor.fetchone()["id"]

        cursor.execute(
            f"INSERT INTO users (username, full_name, role, password, created_by) VALUES ({ph},{ph},{ph},{ph},{ph})",
            ("student2", "Estudiante Dos", "student", get_password_hash(PASSWORD), teacher_id),
        )
        cursor.execute(f"SELECT id FROM users WHERE username = {ph}", ("student2",))
        student2_id = cursor.fetchone()["id"]

        print(f"Usuarios creados: admin(id={admin_id}), teacher(id={teacher_id}), student1(id={student1_id}), student2(id={student2_id})")

        cursor.execute(
            f"INSERT INTO classes (name, description, teacher_id) VALUES ({ph},{ph},{ph})",
            ("1ro Básico A", "Clase de Braille nivel inicial", teacher_id),
        )
        class_id = cursor.lastrowid
        print(f"Clase '1ro Básico A' creada (id={class_id}).")

        cursor.execute(
            f"INSERT INTO class_students (class_id, student_id) VALUES ({ph},{ph})",
            (class_id, student1_id),
        )
        cursor.execute(
            f"INSERT INTO class_students (class_id, student_id) VALUES ({ph},{ph})",
            (class_id, student2_id),
        )
        print("Estudiantes asignados a la clase.")

        for lesson in lessons_data:
            cursor.execute(
                f"INSERT INTO lessons (id, title, description, difficulty) VALUES ({ph},{ph},{ph},{ph})",
                (lesson["id"], lesson["title"], lesson["description"], lesson["difficulty"]),
            )
            for step in lesson["steps"]:
                cursor.execute(
                    f"INSERT INTO lesson_steps (lesson_id, step_index, type, target, prompt, hint, max_attempts) VALUES ({ph},{ph},{ph},{ph},{ph},{ph},{ph})",
                    (lesson["id"], step["step_index"], step["type"], step["target"], step["prompt"], step["hint"], step["max_attempts"]),
                )
            cursor.execute(
                f"INSERT INTO class_lessons (class_id, lesson_id) VALUES ({ph},{ph})",
                (class_id, lesson["id"]),
            )
            print(f"Lección '{lesson['title']}' creada y asignada a la clase.")

    print("\nSeed completado. Credenciales:")
    print(f"  admin     / {PASSWORD}  (admin)")
    print(f"  teacher1  / {PASSWORD}  (profesor)")
    print(f"  student1  / {PASSWORD}  (estudiante)")
    print(f"  student2  / {PASSWORD}  (estudiante)")


if __name__ == "__main__":
    seed()
