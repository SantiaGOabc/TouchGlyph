def test_create_lesson_as_teacher(client, teacher_token, shared_db_connection):
    lesson_data = {
        "title": "Lección de Prueba",
        "description": "Descripción",
        "difficulty": "beginner",
        "priority": 1,
        "steps": [
            {"type": "input", "target": "A", "prompt": "Escribe A", "max_attempts": 3}
        ]
    }
    response = client.post('/api/teacher/lessons',
                           json=lesson_data,
                           headers={"Authorization": f"Bearer {teacher_token}"})
    assert response.status_code == 201
    lesson_id = response.get_json()['lesson_id']
    
    cursor = shared_db_connection.cursor()
    cursor.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,))
    lesson = cursor.fetchone()
    assert lesson['title'] == "Lección de Prueba"

    cursor.execute("SELECT * FROM lesson_steps WHERE lesson_id = ?", (lesson_id,))
    steps = cursor.fetchall()
    assert len(steps) == 1