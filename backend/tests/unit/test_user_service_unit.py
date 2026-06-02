import pytest
from unittest.mock import patch, MagicMock
from user_service.services import UserService

@pytest.fixture
def mock_repo():
    return MagicMock()

@pytest.fixture
def mock_face():
    return MagicMock()

@pytest.fixture
def service(mock_repo, mock_face):
    with patch('user_service.services.create_access_token', return_value='fake-jwt-token'):
        srv = UserService()
        srv.user_repo = mock_repo
        srv.face_service = mock_face
        yield srv

# Registro de usuario (password)
class TestRegisterUser:
    def test_register_success(self, service, mock_repo):
        # Arrange
        mock_repo.get_user_by_username.return_value = None  # no existe
        mock_repo.create_user.return_value = 1
        user_data = {'id': 1, 'username': 'nuevo', 'full_name': 'Nuevo', 'role': 'student'}
        mock_repo.get_user_by_id.return_value = user_data

        result, error = service.register_user('nuevo', 'Nuevo', 'student', 'pass123')

        assert error is None
        assert result == {
            'access_token': 'fake-jwt-token',
            'token_type': 'bearer',
            'user': user_data
        }
        mock_repo.create_user.assert_called_once_with('nuevo', 'Nuevo', 'student', 'pass123', None)

    def test_register_existing_user(self, service, mock_repo):
        # Simular que el usuario ya existe
        mock_repo.get_user_by_username.return_value = {'id': 2}
        result, error = service.register_user('existente', 'X', 'student', 'pass')
        assert result is None
        assert error == "El nombre de usuario ya está registrado"
        mock_repo.create_user.assert_not_called()

    def test_register_with_created_by(self, service, mock_repo):
        mock_repo.get_user_by_username.return_value = None
        mock_repo.create_user.return_value = {'id':10}
        mock_repo.get_user_by_id.return_value = {'id': 10, 'role':'teacher'}
        service.register_user('user', 'name', 'teacher', 'pass', created_by=5)
        # Verificar que se pasa created_by al repositorio
        mock_repo.create_user.assert_called_with('user', 'name', 'teacher', 'pass', 5)

# Login con contraseña
class TestLoginPassword:
    def test_login_success(self, service, mock_repo):
        user = {'id': 3, 'username': 'ana', 'full_name': 'Ana', 'role': 'student', 'password': 'hash'}
        mock_repo.authenticate_user.return_value = user
        result, error = service.login_password('ana', 'correcta')
        assert error is None
        assert result['access_token'] == 'fake-jwt-token'
        assert result['user']['username'] == 'ana'
        mock_repo.authenticate_user.assert_called_once_with('ana', 'correcta')

    def test_login_invalid_credentials(self, service, mock_repo):
        mock_repo.authenticate_user.return_value = None
        result, error = service.login_password('ana', 'mala')
        assert result is None
        assert error == "Credenciales inválidas"

# Login facial
class TestLoginFace:
    def test_face_detection_fails(self, service, mock_face):
        mock_face.extract_face_encoding.return_value = None
        result, error = service.login_face('imagen')
        assert result is None
        assert error == "No se detectó un rostro en la imagen"

    def test_no_stored_encodings(self, service, mock_face, mock_repo):
        mock_face.extract_face_encoding.return_value = [0.1, 0.2]
        mock_repo.get_all_face_encodings.return_value = []  # vacío
        result, error = service.login_face('imagen')
        assert error == "No hay rostros registrados en el sistema"

    def test_face_not_recognized(self, service, mock_face, mock_repo):
        mock_face.extract_face_encoding.return_value = [0.1, 0.2]
        mock_repo.get_all_face_encodings.return_value = [{'user_id': 1, 'face_encoding': [0.3, 0.4]}]
        mock_face.find_matching_user.return_value = None  # no encuentra
        result, error = service.login_face('imagen')
        assert error == "Rostro no reconocido"

    def test_user_not_found_after_match(self, service, mock_face, mock_repo):
        mock_face.extract_face_encoding.return_value = [0.1, 0.2]
        mock_repo.get_all_face_encodings.return_value = [{'user_id': 99, 'face_encoding': [0.1, 0.2]}]
        mock_face.find_matching_user.return_value = 99
        mock_repo.get_user_by_id.return_value = None  # usuario no existe en BD
        result, error = service.login_face('imagen')
        assert error == "Usuario no encontrado"

    def test_face_login_success(self, service, mock_face, mock_repo):
        encoding = [0.1, 0.2, 0.3]
        mock_face.extract_face_encoding.return_value = encoding
        mock_repo.get_all_face_encodings.return_value = [{'user_id': 10}]
        mock_face.find_matching_user.return_value = 10
        user = {'id': 10, 'username': 'facial', 'full_name': 'Face User', 'role': 'student'}
        mock_repo.get_user_by_id.return_value = user
        result, error = service.login_face('foto')
        assert error is None
        assert result['access_token'] == 'fake-jwt-token'
        assert result['user'] == user
        mock_face.extract_face_encoding.assert_called_once_with('foto')
        mock_repo.get_all_face_encodings.assert_called_once()
        mock_face.find_matching_user.assert_called_once_with(encoding, [{'user_id': 10}])

# Registro facial
class TestRegisterFace:
    def test_extraction_fails(self, service, mock_face):
        mock_face.extract_face_encoding.return_value = None
        ok, error = service.register_face(1, 'imagen')
        assert ok is False
        assert error == "No se pudo extraer características faciales"

    def test_save_fails(self, service, mock_face, mock_repo):
        mock_face.extract_face_encoding.return_value = [0.1]
        mock_repo.save_face_encoding.return_value = False
        import base64
        valid_b64 = base64.b64encode(b"fake_image").decode()
        ok, error = service.register_face(1, valid_b64)
        assert ok is False
        assert error == "Error al guardar en base de datos"

    def test_register_success(self, service, mock_face, mock_repo):
        mock_face.extract_face_encoding.return_value = [0.5, 0.6]
        mock_repo.save_face_encoding.return_value = True
        ok, error = service.register_face(1, 'aW1hZ2U=')  # base64 de "image"
        assert ok is True
        assert error is None
        # Verificar que se pasó la imagen decodificada
        call_args = mock_repo.save_face_encoding.call_args[0]
        assert call_args[0] == 1
        import base64
        expected_bytes = base64.b64decode('aW1hZ2U=')
        assert call_args[1] == expected_bytes
        assert call_args[2] == [0.5, 0.6]

# Estado facial y eliminación
class TestFaceStatusDelete:
    def test_has_face_true(self, service, mock_repo):
        mock_repo.get_face_encoding.return_value = {'face_encoding': '...'}
        assert service.has_face_registered(1) is True

    def test_has_face_false(self, service, mock_repo):
        mock_repo.get_face_encoding.return_value = None
        assert service.has_face_registered(2) is False

    def test_delete_face_permission_denied(self, service):
        ok, error = service.delete_face(5, requester_id=6, requester_role='student')
        assert ok is False
        assert error == "Permiso denegado"

    def test_delete_face_success_as_owner(self, service, mock_repo):
        mock_repo.delete_face_encoding.return_value = True
        ok, error = service.delete_face(5, requester_id=5, requester_role='student')
        assert ok is True
        assert error is None
        mock_repo.delete_face_encoding.assert_called_once_with(5)

    def test_delete_face_success_as_admin(self, service, mock_repo):
        mock_repo.delete_face_encoding.return_value = True
        ok, error = service.delete_face(5, requester_id=1, requester_role='admin')
        assert ok is True
        mock_repo.delete_face_encoding.assert_called_once_with(5)

    def test_delete_face_not_found(self, service, mock_repo):
        mock_repo.delete_face_encoding.return_value = False
        ok, error = service.delete_face(5, requester_id=5, requester_role='student')
        assert ok is False
        assert error == "No se encontró registro facial"

# Obtener imagen facial
class TestGetFaceImage:
    def test_permission_denied(self, service):
        img, err = service.get_face_image(10, requester_id=11, requester_role='student')
        assert img is None
        assert err == "Permiso denegado"

    def test_no_image_registered(self, service, mock_repo):
        mock_repo.get_face_encoding.return_value = None
        img, err = service.get_face_image(10, requester_id=10, requester_role='student')
        assert img is None
        assert err == "No hay imagen registrada"

    def test_get_image_success_owner(self, service, mock_repo):
        fake_image = b'fakebytes'
        mock_repo.get_face_encoding.return_value = {'face_image': fake_image}
        img, err = service.get_face_image(10, requester_id=10, requester_role='student')
        assert err is None
        # Verificar que devuelve la cadena base64 correcta
        import base64
        assert img == base64.b64encode(fake_image).decode('utf-8')

    def test_get_image_success_admin(self, service, mock_repo):
        fake_image = b'pic'
        mock_repo.get_face_encoding.return_value = {'face_image': fake_image}
        img, err = service.get_face_image(10, requester_id=1, requester_role='admin')
        assert err is None
        import base64
        assert img == base64.b64encode(fake_image).decode('utf-8')