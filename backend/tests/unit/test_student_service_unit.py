import pytest
from unittest.mock import MagicMock, patch
from student_service.student_service import StudentService

@pytest.fixture
def service():
    """Servicio con repo mockeado."""
    srv = StudentService()
    srv.repo = MagicMock()
    return srv

# get_student_lessons
def test_get_lessons_without_completed(service):
    fake_lessons = [
        {'id': 'L1', 'completed': 0, 'score': 0},
        {'id': 'L2', 'completed': 1, 'score': 10}
    ]
    fake_stats = {'completed': 1, 'total_score': 10, 'total': 2}
    service.repo.get_lessons.return_value = {
        'lessons': fake_lessons,
        'stats': fake_stats
    }

    result = service.get_student_lessons(1, show_completed=False)

    service.repo.get_lessons.assert_called_once_with(1, False)
    assert result == {'lessons': fake_lessons, 'stats': fake_stats}

def test_get_lessons_with_completed(service):
    # Mismo patrón pero con show_completed=True
    fake_lessons = [{'id': 'L2', 'completed': 1, 'score': 10}]
    fake_stats = {'completed': 1, 'total_score': 10, 'total': 1}
    service.repo.get_lessons.return_value = {
        'lessons': fake_lessons,
        'stats': fake_stats
    }

    result = service.get_student_lessons(1, show_completed=True)
    service.repo.get_lessons.assert_called_once_with(1, True)
    assert result == {'lessons': fake_lessons, 'stats': fake_stats}

# begin_session
def test_begin_session(service):
    service.repo.start_session.return_value = "session123"
    sid = service.begin_session(1, "L1")
    service.repo.start_session.assert_called_once_with(1, "L1")
    assert sid == "session123"

# get_next_prompt
def test_get_next_prompt_session_not_found(service):
    service.repo.get_session.return_value = None
    data, error = service.get_next_prompt("bad_id")
    assert data is None
    assert error == "Session not found"

def test_get_next_prompt_finished_lesson(service):
    session = {'id': 's1', 'lesson_id': 'L1', 'user_id': 1, 'score': 3}
    service.repo.get_session.return_value = session
    service.repo.get_current_step_index.return_value = 3
    service.repo.get_total_steps.return_value = 3
    service.repo.get_lesson_step.return_value = None  # sin paso
    service.repo.count_completed_steps.return_value = 3
    service.repo.has_completed_lesson.return_value = False

    data, error = service.get_next_prompt("s1")

    assert data == {"finished": True, "score": 3, "user_id": 1}
    assert error is None
    service.repo.mark_session_finished.assert_called_once_with("s1")
    service.repo.update_student_progress.assert_called_once_with(1, "L1", 3, "s1")

def test_get_next_prompt_ongoing_step(service):
    session = {'id': 's1', 'lesson_id': 'L1', 'user_id': 1, 'score': 1}
    step = {
        'prompt': 'Escribe hola',
        'target': 'hola',
        'hint': 'Saludo',
        'type': 'input',
        'step_index': 2,
        'max_attempts': 3
    }
    service.repo.get_session.return_value = session
    service.repo.get_current_step_index.return_value = 2
    service.repo.get_total_steps.return_value = 5
    service.repo.get_lesson_step.return_value = step
    service.repo.count_step_attempts.return_value = 1

    data, error = service.get_next_prompt("s1")

    expected = {
        "finished": False,
        "prompt": 'Escribe hola',
        "target": 'hola',
        "hint": 'Saludo',
        "type": 'input',
        "step_type": 'input',
        "step_index": 2,
        "max_attempts": 3,
        "attempts": 1,
        "score": 1,
        "user_id": 1,
        "total_steps": 5
    }
    assert data == expected
    assert error is None
    service.repo.mark_session_finished.assert_not_called()
    service.repo.update_student_progress.assert_not_called()

# submit_answer
def test_submit_answer_session_not_found(service):
    service.repo.get_session.return_value = None
    result, status = service.submit_answer("bad_id", "hello")
    assert result == {"error": "Session not found"}
    assert status == 404

def test_submit_answer_correct_with_next_step(service):
    session = {'id': 's1', 'lesson_id': 'L1', 'user_id': 1, 'score': 2}
    current_step = {'target': 'PYTHON', 'max_attempts': 2}
    next_step = {'step_index': 1}  # existe siguiente paso, por lo que no termina
    service.repo.get_session.return_value = session
    service.repo.get_current_step_index.return_value = 0
    service.repo.get_lesson_step.side_effect = [current_step, next_step]
    service.repo.count_step_attempts.return_value = 0

    result, status = service.submit_answer("s1", "python")

    assert result == {
        "correct": True,
        "attempts": 1,
        "max_attempts": 2
    }
    assert status == 200
    service.repo.insert_attempt.assert_called_once_with(
        "s1", "L1", 1, 0, "PYTHON", True, 1
    )
    service.repo.increment_session_score.assert_called_once_with("s1")
    service.repo.mark_session_finished.assert_not_called()
    service.repo.update_student_progress.assert_not_called()

def test_submit_answer_correct_last_step(service):
    session = {'id': 's1', 'lesson_id': 'L1', 'user_id': 1, 'score': 2}
    current_step = {'target': 'PYTHON', 'max_attempts': 2}
    # No hay siguiente paso
    service.repo.get_session.return_value = session
    service.repo.get_current_step_index.return_value = 0
    service.repo.get_lesson_step.side_effect = [current_step, None]
    service.repo.count_step_attempts.return_value = 0
    service.repo.get_total_steps.return_value = 1
    service.repo.count_completed_steps.return_value = 1
    service.repo.has_completed_lesson.return_value = False

    result, status = service.submit_answer("s1", "python")

    assert result == {
        "correct": True,
        "attempts": 1,
        "max_attempts": 2,
        "finished": True
    }
    service.repo.mark_session_finished.assert_called_once_with("s1")
    service.repo.update_student_progress.assert_called_once_with(1, "L1", 3, "s1")  # score +1

def test_submit_answer_incorrect_within_attempts(service):
    session = {'id': 's1', 'lesson_id': 'L1', 'user_id': 1, 'score': 0}
    step = {'target': 'PYTHON', 'max_attempts': 3}
    service.repo.get_session.return_value = session
    service.repo.get_current_step_index.return_value = 0
    service.repo.get_lesson_step.return_value = step
    service.repo.count_step_attempts.return_value = 1

    result, status = service.submit_answer("s1", "perl")

    assert result == {
        "correct": False,
        "attempts": 2,
        "max_attempts": 3
    }
    service.repo.insert_attempt.assert_called_with(
        "s1", "L1", 1, 0, "PERL", False, 2
    )
    service.repo.increment_session_score.assert_not_called()

def test_submit_answer_incorrect_max_attempts_reached(service):
    session = {'id': 's1', 'lesson_id': 'L1', 'user_id': 1, 'score': 0}
    step = {'target': 'PYTHON', 'max_attempts': 2, 'hint': 'Pista'}
    service.repo.get_session.return_value = session
    service.repo.get_current_step_index.return_value = 0
    service.repo.get_lesson_step.return_value = step
    service.repo.count_step_attempts.return_value = 1

    result, status = service.submit_answer("s1", "perl")

    assert result == {
        "correct": False,
        "attempts": 2,
        "max_attempts": 2,
        "hint": "Pista"
    }

def test_submit_answer_incorrect_max_attempts_no_hint_fallback(service):
    session = {'id': 's1', 'lesson_id': 'L1', 'user_id': 1, 'score': 0}
    step = {'target': 'PYTHON', 'max_attempts': 2}
    service.repo.get_session.return_value = session
    service.repo.get_current_step_index.return_value = 0
    service.repo.get_lesson_step.return_value = step
    service.repo.count_step_attempts.return_value = 1

    result, status = service.submit_answer("s1", "perl")

    assert result['hint'] == "La respuesta correcta es: PYTHON"

# skip_step
def test_skip_step_session_not_found(service):
    service.repo.get_session.return_value = None
    result, status = service.skip_step("bad_id")
    assert result == {"error": "Session not found"}
    assert status == 404

def test_skip_step_success(service):
    session = {'id': 's1', 'lesson_id': 'L1', 'user_id': 1}
    service.repo.get_session.return_value = session
    service.repo.get_current_step_index.return_value = 3

    result, status = service.skip_step("s1")
    assert result == {"ok": True}
    assert status == 200
    service.repo.insert_attempt.assert_called_once_with(
        "s1", "L1", 1, 3, '__SKIP__', False, 1
    )