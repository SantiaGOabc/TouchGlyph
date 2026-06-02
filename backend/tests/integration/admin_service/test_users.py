def test_get_users_as_admin(client, admin_token):
    response = client.get('/api/admin/users',
                          headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert 'users' in response.get_json()

def test_create_user_as_admin(client, admin_token, shared_db_connection):
    db_cursor = shared_db_connection.cursor()
    response = client.post('/api/admin/users',
                           json={
                               "username": "creado_por_admin",
                               "full_name": "Creado",
                               "role": "teacher",
                               "password": "pass123"
                           },
                           headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 201
    user_id = response.get_json()['user_id']
    db_cursor.execute("SELECT * FROM users WHERE id=?", (user_id,))
    user = db_cursor.fetchone()
    assert user['username'] == "creado_por_admin"

def test_delete_user_as_admin(client, admin_token, shared_db_connection):
    db_cursor = shared_db_connection.cursor()
    # Crear usuario a eliminar
    from shared.utils import get_password_hash
    db_cursor.execute(
        "INSERT INTO users (username, full_name, role, password) VALUES (?,?,?,?)",
        ("to_delete", "Delete Me", "student", get_password_hash("pass"))
    )
    db_cursor.connection.commit()
    user_id = db_cursor.lastrowid
    
    response = client.delete(f'/api/admin/users/{user_id}',
                             headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    db_cursor.execute("SELECT * FROM users WHERE id=?", (user_id,))
    assert db_cursor.fetchone() is None