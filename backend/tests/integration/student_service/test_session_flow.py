def test_start_session_requires_auth(client):
    response = client.post('/api/student/start-session', json={"lesson_id": "abc"})
    assert response.status_code == 401

def test_start_session_success(client, student_token, shared_db_connection):
    cursor = shared_db_connection.cursor()
    lesson_id = "test-lesson-1"
    cursor.execute("INSERT INTO lessons (id, title) VALUES (?, ?)", (lesson_id, "Lección Test"))
    cursor.execute("INSERT INTO lesson_steps (lesson_id, step_index, target, prompt) VALUES (?, ?, ?, ?)",
                   (lesson_id, 0, "A", "Escribe A"))
    shared_db_connection.commit()

    response = client.post('/api/student/start-session',
                           json={"lesson_id": lesson_id},
                           headers={"Authorization": f"Bearer {student_token}"})
    assert response.status_code == 200
    session_id = response.get_json()['session_id']
    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    assert session is not None
    assert session['lesson_id'] == lesson_id


def test_submit_correct_answer(client, student_token, shared_db_connection):
    # 1. Crear lección de prueba con pasos
    cursor = shared_db_connection.cursor()
    cursor.execute(
        "INSERT INTO lessons (id, title, description, difficulty, priority) "
        "VALUES (?, ?, ?, ?, ?)",
        ("Ltest1", "Lección Test", "Desc", "beginner", 1)
    )
    cursor.execute(
        "INSERT INTO lesson_steps (lesson_id, step_index, type, target, prompt, max_attempts) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        ("Ltest1", 0, "input", "A", "Escribe la letra A", 3)
    )
    shared_db_connection.commit()

    headers = {"Authorization": f"Bearer {student_token}"}

    # 2. Iniciar sesión
    resp_start = client.post('/api/student/start-session',
                             json={"lesson_id": "Ltest1"},
                             headers=headers)
    assert resp_start.status_code == 200, f"start-session failed: {resp_start.data}"
    session_id = resp_start.get_json()['session_id']

    # 3. Enviar respuesta correcta
    resp_submit = client.post(f'/api/student/session/{session_id}/submit',
                              json={"answer": "A"},
                              headers=headers)
    assert resp_submit.status_code == 200, f"submit failed: {resp_submit.data}"
    data = resp_submit.get_json()
    assert data is not None, "Respuesta no es JSON"
    assert data['correct'] is True