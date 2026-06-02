import hashlib
import secrets
import hmac

SCRYPT_N = 16384
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 64
SALT_SIZE = 16

def get_password_hash(password: str) -> str:
    try:
        salt = secrets.token_bytes(SALT_SIZE)
        derived = hashlib.scrypt(password.encode(), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, dklen=SCRYPT_DKLEN)
        return salt.hex() + '$' + derived.hex()
    except (ValueError, TypeError, RuntimeError) as e:
        raise ValueError(f"Error al generar hash de contraseña: {e}") from e

def verify_password(plain: str, hashed: str) -> bool:
    try:
        salt_hex, hash_hex = hashed.split('$', 1)
    except ValueError:
        return False
    try:
        salt = bytes.fromhex(salt_hex)
        derived = hashlib.scrypt(plain.encode(), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, dklen=SCRYPT_DKLEN)
        return hmac.compare_digest(derived.hex(), hash_hex)
    except (ValueError, TypeError, RuntimeError):
        return False