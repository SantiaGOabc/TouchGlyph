import pytest
from unittest.mock import MagicMock
from teacher_service.services import TeacherService

@pytest.fixture
def service():
    """Servicio con repo mockeado."""
    srv = TeacherService()
    srv.repo = MagicMock()
    return srv

# Dashboard
def test_get_dashboard(service):
    # Arrange
    service.repo.get_dashboard_stats.return_value = (15, 20)  # total_students, total_lessons
    service.repo.get_students_progress.return_value = [
        {'id': 1, 'full_name': 'Ana', 'attempts': 10, 'corrects': 8, 'accuracy': 80.0, 'completed': 3, 'last_activity': '2025-01-01T00:00:00'},
        {'id': 2, 'full_name': 'Luis', 'attempts': 5, 'corrects': 2, 'accuracy': 40.0, 'completed': 1, 'last_activity': None}
    ]

    # Act
    result = service.get_dashboard(teacher_id=5)

    # Assert
    service.repo.get_dashboard_stats.assert_called_once_with(5)
    service.repo.get_students_progress.assert_called_once_with(5)
    expected = {
        "total_students": 15,
        "total_lessons": 20,
        "active_sessions": 2,  # len(students)
        "students": [
            {'id': 1, 'full_name': 'Ana', 'attempts': 10, 'corrects': 8, 'accuracy': 80.0, 'completed': 3, 'last_activity': '2025-01-01T00:00:00'},
            {'id': 2, 'full_name': 'Luis', 'attempts': 5, 'corrects': 2, 'accuracy': 40.0, 'completed': 1, 'last_activity': None}
        ]
    }
    assert result == expected

# Clases
def test_get_teacher_classes(service):
    fake_classes = [{'id': 1, 'name': 'Clase A', 'students': []}]
    service.repo.get_teacher_classes.return_value = fake_classes
    result = service.get_teacher_classes(teacher_id=5)
    service.repo.get_teacher_classes.assert_called_once_with(5)
    assert result == fake_classes

# Detalle de estudiante
def test_get_student_detail_found(service):
    detail = {'student': {'id': 1, 'name': 'Ana'}, 'progress': [], 'overall': {}}
    service.repo.get_student_detail.return_value = detail
    result = service.get_student_detail(1)
    service.repo.get_student_detail.assert_called_once_with(1)
    assert result == detail

def test_get_student_detail_not_found(service):
    service.repo.get_student_detail.return_value = None
    result = service.get_student_detail(99)
    assert result is None

# Lecciones (listar, obtener)
def test_list_lessons(service):
    lessons = [{'id': 'L1', 'title': 'Lección 1'}]
    service.repo.get_all_lessons.return_value = lessons
    result = service.list_lessons()
    service.repo.get_all_lessons.assert_called_once()
    assert result == lessons

def test_get_lesson_found(service):
    lesson_data = {'lesson': {'id': 'L1'}, 'steps': [], 'performance': []}
    service.repo.get_lesson.return_value = lesson_data
    result = service.get_lesson('L1')
    service.repo.get_lesson.assert_called_once_with('L1')
    assert result == lesson_data

def test_get_lesson_not_found(service):
    service.repo.get_lesson.return_value = None
    result = service.get_lesson('bad')
    assert result is None

# Crear lección
def test_create_lesson_success(service):
    service.repo.create_lesson.return_value = "abc123"
    data = {
        "title": "Mi Lección",
        "description": "Desc",
        "difficulty": "intermediate",
        "priority": 2,
        "steps": [{"target": "A", "prompt": "Escribe A"}]
    }
    lesson_id = service.create_lesson(data)
    assert lesson_id == "abc123"
    expected_steps = [{"type": "input", "target": "A", "prompt": "Escribe A", "hint": None, "max_attempts": 3}]
    service.repo.create_lesson.assert_called_once_with(
        title="Mi Lección",
        description="Desc",
        difficulty="intermediate",
        priority=2,
        steps=expected_steps
    )

def test_create_lesson_missing_title(service):
    data = {"description": "sin título", "steps": [{"target": "A"}]}
    with pytest.raises(ValueError, match="El título es requerido"):
        service.create_lesson(data)

def test_create_lesson_empty_steps(service):
    data = {"title": "Lección", "steps": []}
    with pytest.raises(ValueError, match="Debe incluir al menos un paso"):
        service.create_lesson(data)

def test_create_lesson_no_steps_key(service):
    data = {"title": "Lección"}
    with pytest.raises(ValueError, match="Debe incluir al menos un paso"):
        service.create_lesson(data)

def test_create_lesson_invalid_priority(service):
    data = {"title": "Lección", "steps": [{"target": "A"}], "priority": 5}
    with pytest.raises(ValueError, match="La prioridad debe ser 0-3"):
        service.create_lesson(data)

def test_create_lesson_default_priority(service):
    service.repo.create_lesson.return_value = "xyz"
    data = {"title": "T", "steps": [{"target": "A"}]}  # sin prioridad
    lesson_id = service.create_lesson(data)
    call_args = service.repo.create_lesson.call_args
    assert call_args[1]['priority'] == 1

# Actualizar lección
def test_update_lesson_success(service):
    service.repo.update_lesson.return_value = True
    result = service.update_lesson('L1', {'title': 'Nuevo título'})
    service.repo.update_lesson.assert_called_once_with('L1', {'title': 'Nuevo título'})
    assert result is True

def test_update_lesson_failure(service):
    service.repo.update_lesson.return_value = False
    result = service.update_lesson('bad', {})
    assert result is False

# Eliminar lección
def test_delete_lesson_success(service):
    service.repo.delete_lesson.return_value = True
    result = service.delete_lesson('L1')
    service.repo.delete_lesson.assert_called_once_with('L1')
    assert result is True

def test_delete_lesson_failure(service):
    service.repo.delete_lesson.return_value = False
    result = service.delete_lesson('L1')
    assert result is False

# Asignar lección a clase
def test_assign_lesson_to_class(service):
    service.repo.assign_lesson_to_class.return_value = True
    result = service.assign_lesson_to_class('L1', 2, '2025-12-31')
    service.repo.assign_lesson_to_class.assert_called_once_with('L1', 2, '2025-12-31')
    assert result is True

def test_assign_lesson_without_due_date(service):
    service.repo.assign_lesson_to_class.return_value = True
    result = service.assign_lesson_to_class('L1', 2)
    service.repo.assign_lesson_to_class.assert_called_once_with('L1', 2, None)
    assert result is True