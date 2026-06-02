import base64
from unittest.mock import patch
import user_service.routes

def test_register_face_requires_auth(client):
    response = client.post('/api/face/register', json={"user_id": 1, "image_base64": "fake"})
    assert response.status_code == 401

def test_register_face_success(client, student_token, student_user, shared_db_connection):
    fake_image = base64.b64encode(b"fakeimage").decode()
    
    with patch.object(user_service.routes.service.face_service,
                      'extract_face_encoding', return_value=[0.1, 0.2, 0.3]):
        response = client.post('/api/face/register',
                               json={"user_id": student_user["id"], "image_base64": fake_image},
                               headers={"Authorization": f"Bearer {student_token}"})
    
    assert response.status_code == 200
    assert response.get_json()['success'] is True

    cursor = shared_db_connection.cursor()
    cursor.execute("SELECT * FROM face_encodings WHERE user_id = ?", (student_user["id"],))
    face = cursor.fetchone()
    assert face is not None
    assert face['face_encoding'] == '[0.1, 0.2, 0.3]'

def test_login_face_success(client, shared_db_connection):
    # Crear un usuario de prueba directamente en la BD
    cursor = shared_db_connection.cursor()
    cursor.execute(
        "INSERT INTO users (username, full_name, role, password) VALUES (?, ?, ?, ?)",
        ("facetest", "Face Test User", "student", "pass")
    )
    user_id = cursor.lastrowid
    shared_db_connection.commit()

    fake_image = base64.b64encode(b"fakeimage").decode()
    
    with patch.object(user_service.routes.service.face_service,
                      'extract_face_encoding', return_value=[0.1, 0.2, 0.3]), \
         patch.object(user_service.routes.service.face_service,
                      'find_matching_user', return_value=user_id), \
         patch.object(user_service.routes.service.user_repo,
                      'get_all_face_encodings',
                      return_value=[{"user_id": user_id, "face_encoding": [0.1, 0.2, 0.3]}]):
        response = client.post('/api/face/login', json={"image_base64": fake_image})
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert data['user']['id'] == user_id