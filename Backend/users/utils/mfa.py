import hashlib
import secrets

def generate_backup_code():
    """Generate a single backup code and its hash."""
    raw_code = secrets.token_hex(4).upper()  # 8 hex chars, uppercase
    hashed_code = hashlib.sha256(raw_code.encode()).hexdigest()
    return raw_code, hashed_code

def generate_backup_codes(count=5):
    """Generate a list of backup codes (plain + hashed)."""
    codes = []
    hashes = []
    for _ in range(count):
        raw, hashed = generate_backup_code()
        codes.append(raw)
        hashes.append(hashed)
    return codes, hashes

def verify_backup_code(user, code_to_check):
    """Verify backup code against stored hashes."""
    hashed = hashlib.sha256(code_to_check.encode()).hexdigest()
    if hashed in user.backup_codes:
        user.backup_codes.remove(hashed)
        user.save()
        return True
    return False

def hash_backup_code(code):
    """Manually hash a backup code (for admin panel/search etc)."""
    return hashlib.sha256(code.encode()).hexdigest()
