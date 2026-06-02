from unittest.mock import patch

def test_toggle_point_requires_role(client, student_token):
    response = client.post('/api/devices/toggle',
                           json={"punto": 1},
                           headers={"Authorization": f"Bearer {student_token}"})
    assert response.status_code == 403

@patch('devices_service.esp32_client.ESP32Client.toggle_punto')
def test_toggle_point_as_teacher(mock_toggle, client, teacher_token):
    mock_toggle.return_value = {"status": "ok", "punto": 1, "estado": True}
    response = client.post('/api/devices/toggle',
                           json={"punto": 1},
                           headers={"Authorization": f"Bearer {teacher_token}"})
    assert response.status_code == 200
    assert response.get_json()['status'] == 'ok'
    mock_toggle.assert_called_once_with(1)

@patch('devices_service.esp32_client.ESP32Client.check_connection')
def test_device_status(mock_check, client, teacher_token):
    mock_check.return_value = {"conectado": True, "dispositivo": "ESP32"}
    response = client.get('/api/devices/device-status',
                          headers={"Authorization": f"Bearer {teacher_token}"})
    assert response.status_code == 200
    assert response.get_json()['conectado'] is True