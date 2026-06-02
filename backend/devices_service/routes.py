from flask import Blueprint, request, jsonify
from shared.auth import token_required, role_required
from .services import DevicesService
from shared.schemas import TogglePointRequest, SendLetterRequest

devices_bp = Blueprint('devices', __name__, url_prefix='/api/devices')
service = DevicesService()

@devices_bp.route('/toggle', methods=['POST'])
@token_required
@role_required('teacher', 'admin')
def toggle_point():
    """
    Toggle a Braille pin (1-6)
    ---
    tags: [Devices]
    parameters:
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {punto: {type: integer, minimum: 0, maximum: 5}}}
    responses:
      200: {description: Pin toggled}
    """
    data = TogglePointRequest(**request.get_json())
    result = service.toggle_point(data.punto)
    return jsonify(result)

@devices_bp.route('/letter', methods=['POST'])
@token_required
@role_required('teacher', 'admin', 'student')
def send_letter():
    """
    Send a letter to the Braille display
    ---
    tags: [Devices]
    parameters:
      - in: body
        name: body
        required: true
        schema: {type: object, properties: {letra: {type: string, minLength: 1, maxLength: 1}}}
    responses:
      200: {description: Letter sent}
    """
    data = SendLetterRequest(**request.get_json())
    result = service.send_letter(data.letra)
    return jsonify(result)

@devices_bp.route('/clear', methods=['POST'])
@token_required
@role_required('teacher', 'admin')
def clear_points():
    """
    Clear all Braille pins
    ---
    tags: [Devices]
    responses:
      200: {description: Pins cleared}
    """
    result = service.clear_all()
    return jsonify(result)

@devices_bp.route('/status', methods=['GET'])
@token_required
@role_required('teacher', 'admin', 'student')
def get_status():
    """
    Get Braille display status
    ---
    tags: [Devices]
    responses:
      200: {description: Display status}
    """
    result = service.get_status()
    return jsonify(result)

@devices_bp.route('/device-status', methods=['GET'])
@token_required
@role_required('teacher', 'admin')
def device_connection_status():
    """
    Get ESP32 connection status
    ---
    tags: [Devices]
    responses:
      200: {description: Connection status}
    """
    result = service.get_device_status()
    return jsonify(result)
