import os
os.environ["DB_TYPE"] = "sqlite"

import pytest
import sqlite3
from flask import Flask
from flask_cors import CORS
from contextlib import contextmanager
from shared.database import set_test_connection, clear_test_connection  

# Base de datos SQLite en memoria compartida
@pytest.fixture(scope="module")
def shared_db_connection():
    """Crea una conexión SQLite en memoria y la mantiene viva durante toda la sesión."""
    from shared.config import config as app_config
    app_config.DB_TYPE = "sqlite"

    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Crear todas las tablas necesarias
    cursor.executescript("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'student',
            password TEXT NOT NULL,
            created_by INTEGER,
            ci TEXT DEFAULT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            active INTEGER DEFAULT 1,
            FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE TABLE face_encodings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            face_image BLOB,
            face_encoding TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE lessons (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            difficulty TEXT DEFAULT 'beginner',
            priority INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            active INTEGER DEFAULT 1
        );
        CREATE TABLE lesson_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_id TEXT NOT NULL,
            step_index INTEGER NOT NULL,
            type TEXT DEFAULT 'input',
            target TEXT NOT NULL,
            prompt TEXT NOT NULL,
            hint TEXT,
            max_attempts INTEGER DEFAULT 3,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            UNIQUE(lesson_id, step_index),
            FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
        );
        CREATE TABLE classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            teacher_id INTEGER,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            active INTEGER DEFAULT 1,
            FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE TABLE class_students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            active INTEGER DEFAULT 1,
            UNIQUE(class_id, student_id),
            FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE class_lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER NOT NULL,
            lesson_id TEXT NOT NULL,
            due_date TEXT,
            assigned_at TEXT DEFAULT (datetime('now')),
            active INTEGER DEFAULT 1,
            UNIQUE(class_id, lesson_id),
            FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
        );
        CREATE TABLE sessions (
            id TEXT PRIMARY KEY,
            lesson_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            class_id INTEGER,
            started_at TEXT DEFAULT (datetime('now')),
            finished_at TEXT,
            score INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE SET NULL
        );
        CREATE TABLE attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            lesson_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            step_index INTEGER NOT NULL,
            answer TEXT,
            correct INTEGER DEFAULT 0,
            attempts INTEGER DEFAULT 1,
            ts TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
            FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE student_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            lesson_id TEXT NOT NULL,
            class_id INTEGER,
            completed INTEGER DEFAULT 0,
            score INTEGER DEFAULT 0,
            attempts INTEGER DEFAULT 0,
            completed_at TEXT,
            last_attempt_at TEXT,
            UNIQUE(student_id, lesson_id, class_id),
            FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
            FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
        );
        CREATE TABLE devices (
            id TEXT PRIMARY KEY,
            name TEXT,
            assigned_user_id INTEGER,
            last_seen TEXT,
            active INTEGER DEFAULT 1,
            FOREIGN KEY(assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
        );
    """)
    conn.commit()
    
        # Activar la inyección para todo este módulo de tests
    set_test_connection(conn)
    yield conn
    # Desactivar al final del módulo
    clear_test_connection()
    conn.close()


# Limpieza automática de tablas antes de cada prueba
@pytest.fixture(autouse=True)
def clean_tables(shared_db_connection):
    """Limpia todas las tablas antes de cada prueba para asegurar aislamiento."""
    cursor = shared_db_connection.cursor()
    tables = [
        "attempts", "sessions", "student_progress", "class_lessons",
        "class_students", "classes", "lesson_steps", "lessons",
        "face_encodings", "devices", "users"
    ]
    for table in tables:
        cursor.execute(f"DELETE FROM {table}")
    shared_db_connection.commit()


# Aplicación Flask para pruebas (parchea get_db_connection)
@pytest.fixture(scope="module")
def app(shared_db_connection):
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'test-secret'
    app.config['TESTING'] = True
    CORS(app)
    
    from user_service.routes import user_bp
    from admin_service.routes import admin_bp
    from teacher_service.routes import teacher_bp
    from student_service.student_routes import student_bp
    from devices_service.routes import devices_bp
    
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(teacher_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(devices_bp)
    
    yield app


@pytest.fixture(scope="module")
def client(app):
    return app.test_client()


# Usuarios de prueba (se crean mediante la API real)
@pytest.fixture(scope="module")
def student_user(client):
    response = client.post('/api/register', json={
        "username": "student1",
        "full_name": "Estudiante Uno",
        "role": "student",
        "password": "studentpass"
    })
    assert response.status_code == 201
    data = response.get_json()
    return {
        "id": data['user']['id'],
        "username": "student1",
        "role": "student",
        "token": data['access_token']
    }

@pytest.fixture(scope="module")
def teacher_user(client):
    response = client.post('/api/register', json={
        "username": "teacher1",
        "full_name": "Profesor Uno",
        "role": "teacher",
        "password": "teacherpass"
    })
    assert response.status_code == 201
    data = response.get_json()
    return {
        "id": data['user']['id'],
        "username": "teacher1",
        "role": "teacher",
        "token": data['access_token']
    }

@pytest.fixture(scope="module")
def admin_user(client):
    response = client.post('/api/register', json={
        "username": "admin1",
        "full_name": "Admin Uno",
        "role": "admin",
        "password": "adminpass"
    })
    assert response.status_code == 201
    data = response.get_json()
    return {
        "id": data['user']['id'],
        "username": "admin1",
        "role": "admin",
        "token": data['access_token']
    }


# Tokens para acceso rápido
@pytest.fixture(scope="module")
def student_token(student_user):
    return student_user['token']


@pytest.fixture(scope="module")
def teacher_token(teacher_user):
    return teacher_user['token']

@pytest.fixture(scope="module")
def admin_token(admin_user):
    return admin_user['token']