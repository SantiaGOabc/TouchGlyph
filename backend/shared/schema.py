from shared.config import config
from shared.database import get_db_cursor


def _now():
    return "datetime('now')" if config.DB_TYPE == "sqlite" else "NOW()"


def _autoincrement():
    return "AUTOINCREMENT" if config.DB_TYPE == "sqlite" else "AUTO_INCREMENT"


def _blob():
    return "BLOB" if config.DB_TYPE == "sqlite" else "LONGBLOB"


def create_tables():
    autoinc = _autoincrement()
    now = _now()
    blob = _blob()

    statements = [
        f"""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY {autoinc},
            username VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'student',
            password VARCHAR(255) NOT NULL,
            created_by INTEGER,
            ci VARCHAR(50) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT {now},
            updated_at TIMESTAMP DEFAULT {now},
            active INTEGER DEFAULT 1
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS face_encodings (
            id INTEGER PRIMARY KEY {autoinc},
            user_id INTEGER UNIQUE NOT NULL,
            face_image {blob},
            face_encoding TEXT,
            created_at TIMESTAMP DEFAULT {now},
            updated_at TIMESTAMP DEFAULT {now}
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS lessons (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            difficulty VARCHAR(50) DEFAULT 'beginner',
            priority INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT {now},
            updated_at TIMESTAMP DEFAULT {now},
            active INTEGER DEFAULT 1
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS lesson_steps (
            id INTEGER PRIMARY KEY {autoinc},
            lesson_id VARCHAR(255) NOT NULL,
            step_index INTEGER NOT NULL,
            type VARCHAR(50) DEFAULT 'input',
            target VARCHAR(255) NOT NULL,
            prompt TEXT NOT NULL,
            hint TEXT,
            max_attempts INTEGER DEFAULT 3,
            created_at TIMESTAMP DEFAULT {now},
            updated_at TIMESTAMP DEFAULT {now},
            UNIQUE(lesson_id, step_index)
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY {autoinc},
            name VARCHAR(255) NOT NULL,
            description TEXT,
            teacher_id INTEGER,
            created_at TIMESTAMP DEFAULT {now},
            updated_at TIMESTAMP DEFAULT {now},
            active INTEGER DEFAULT 1
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS class_students (
            id INTEGER PRIMARY KEY {autoinc},
            class_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT {now},
            active INTEGER DEFAULT 1,
            UNIQUE(class_id, student_id)
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS class_lessons (
            id INTEGER PRIMARY KEY {autoinc},
            class_id INTEGER NOT NULL,
            lesson_id VARCHAR(255) NOT NULL,
            due_date TIMESTAMP NULL,
            assigned_at TIMESTAMP DEFAULT {now},
            active INTEGER DEFAULT 1,
            UNIQUE(class_id, lesson_id)
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(255) PRIMARY KEY,
            lesson_id VARCHAR(255) NOT NULL,
            user_id INTEGER NOT NULL,
            class_id INTEGER,
            started_at TIMESTAMP DEFAULT {now},
            finished_at TIMESTAMP NULL,
            score INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY {autoinc},
            session_id VARCHAR(255) NOT NULL,
            lesson_id VARCHAR(255) NOT NULL,
            user_id INTEGER NOT NULL,
            step_index INTEGER NOT NULL,
            answer TEXT,
            correct INTEGER DEFAULT 0,
            attempts INTEGER DEFAULT 1,
            ts TIMESTAMP DEFAULT {now}
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS student_progress (
            id INTEGER PRIMARY KEY {autoinc},
            student_id INTEGER NOT NULL,
            lesson_id VARCHAR(255) NOT NULL,
            class_id INTEGER,
            completed INTEGER DEFAULT 0,
            score INTEGER DEFAULT 0,
            attempts INTEGER DEFAULT 0,
            completed_at TIMESTAMP NULL,
            last_attempt_at TIMESTAMP NULL,
            UNIQUE(student_id, lesson_id, class_id)
        )""",
        f"""
        CREATE TABLE IF NOT EXISTS devices (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            assigned_user_id INTEGER,
            last_seen TIMESTAMP NULL,
            active INTEGER DEFAULT 1
        )""",
    ]

    with get_db_cursor(commit=True) as cursor:
        for stmt in statements:
            cursor.execute(stmt)
