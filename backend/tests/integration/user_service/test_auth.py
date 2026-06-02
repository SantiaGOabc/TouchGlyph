def test_register_student_success(client, shared_db_connection):
    response = client.post('/api/register', json={
        "username": "nuevo_estudiante",
        "full_name": "Nuevo Estudiante",
        "role": "student",
        "password": "secreto123"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert 'access_token' in data
    assert data['user']['username'] == 'nuevo_estudiante'
    cursor = shared_db_connection.cursor()
    cursor.execute("SELECT * FROM users WHERE username = 'nuevo_estudiante'")
    user = cursor.fetchone()
    assert user is not None


def test_register_duplicate_username(client, shared_db_connection):
    client.post('/api/register', json={
        "username": "dup", "full_name": "Uno", "password": "pass"
    })
    response = client.post('/api/register', json={
        "username": "dup", "full_name": "Dos", "password": "pass"
    })
    assert response.status_code == 400
    assert "ya está registrado" in response.get_json()['detail']