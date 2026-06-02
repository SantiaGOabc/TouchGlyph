import pytest
from unittest.mock import MagicMock
from devices_service.services import DevicesService

@pytest.fixture
def mock_client():
    return MagicMock()

@pytest.fixture
def service(mock_client):
    srv = DevicesService()
    srv.client = mock_client
    return srv

# Toggle point
class TestTogglePoint:
    def test_valid_point(self, service, mock_client):
        mock_client.toggle_punto.return_value = {"ok": True}
        result = service.toggle_point(3)
        mock_client.toggle_punto.assert_called_once_with(3)
        assert result == {"ok": True}

    def test_lowest_boundary(self, service, mock_client):
        mock_client.toggle_punto.return_value = {"ok": True}
        result = service.toggle_point(1)
        mock_client.toggle_punto.assert_called_once_with(1)
        assert result == {"ok": True}

    def test_highest_boundary(self, service, mock_client):
        mock_client.toggle_punto.return_value = {"ok": True}
        result = service.toggle_point(6)
        mock_client.toggle_punto.assert_called_once_with(6)

    def test_below_range(self, service, mock_client):
        result = service.toggle_point(0)
        assert result == {"error": "El punto debe estar entre 1 y 6"}
        mock_client.toggle_punto.assert_not_called()

    def test_above_range(self, service, mock_client):
        result = service.toggle_point(7)
        assert result == {"error": "El punto debe estar entre 1 y 6"}
        mock_client.toggle_punto.assert_not_called()

    def test_negative(self, service, mock_client):
        result = service.toggle_point(-3)
        assert result == {"error": "El punto debe estar entre 1 y 6"}

# Send letter
class TestSendLetter:
    def test_send_letter_delegates(self, service, mock_client):
        mock_client.set_letra.return_value = {"puntos": [1]}
        result = service.send_letter("a")
        mock_client.set_letra.assert_called_once_with("a")
        assert result == {"puntos": [1]}

    def test_send_letter_uppercase_passed(self, service, mock_client):
        service.send_letter("Z")
        mock_client.set_letra.assert_called_once_with("Z")

# Clear all
class TestClearAll:
    def test_clear_all(self, service, mock_client):
        mock_client.clear_points.return_value = {"cleared": True}
        result = service.clear_all()
        mock_client.clear_points.assert_called_once_with()
        assert result == {"cleared": True}

# Get status
class TestGetStatus:
    def test_get_status(self, service, mock_client):
        mock_client.get_estado.return_value = {"puntos": [1,3,5]}
        result = service.get_status()
        mock_client.get_estado.assert_called_once_with()
        assert result == {"puntos": [1,3,5]}

# Conectar a dispositivo
class TestGetDeviceStatus:
    def test_get_device_status(self, service, mock_client):
        mock_client.check_connection.return_value = {
            "conectado": True,
            "dispositivo": "ESP32 Braille",
            "ip": "192.168.1.10",
            "tiempo_respuesta_ms": 12.5,
            "estado_actual": {}
        }
        result = service.get_device_status()
        mock_client.check_connection.assert_called_once()
        assert result["conectado"] is True