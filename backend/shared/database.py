import sqlite3
import mysql.connector
from mysql.connector.pooling import MySQLConnectionPool
from contextlib import contextmanager
from shared.config import config

_test_connection = None
_mysql_pool = None

def _get_param_placeholder():
    return '?' if config.DB_TYPE == 'sqlite' else '%s'

def set_test_connection(conn):
    global _test_connection
    _test_connection = conn

def clear_test_connection():
    global _test_connection
    _test_connection = None

def _get_mysql_pool():
    global _mysql_pool
    if _mysql_pool is None:
        _mysql_pool = MySQLConnectionPool(
            pool_name="app_pool",
            pool_size=config.DB_POOL_SIZE,
            pool_reset_session=True,
            host=config.DB_HOST,
            port=config.DB_PORT,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )
    return _mysql_pool

def get_db_connection():
    if _test_connection is not None:
        return _test_connection
    if config.DB_TYPE == 'mysql':
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                port=config.DB_PORT,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME,
                autocommit=True
            )
            return conn
        except mysql.connector.errors.OperationalError as e:
            raise Exception(f"Error conectando a MySQL: {e}")
    else:
        conn = sqlite3.connect(config.DB_NAME)
        return conn

def get_param_placeholder():
    return _get_param_placeholder()


def get_upsert_query(table, columns, placeholders, unique_columns=None):
    """Query UPSERT compatible con SQLite y MySQL."""
    if config.DB_TYPE == 'sqlite':
        return f"INSERT OR REPLACE INTO {table} ({columns}) VALUES ({placeholders})"
    else:
        cols_list = [c.strip() for c in columns.split(',')]
        updates = ", ".join([f"{col}=VALUES({col})" for col in cols_list])
        return f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {updates}"


@contextmanager
def get_db_cursor(commit=False):
    conn = get_db_connection()
    if not conn:
        raise Exception("No se pudo conectar a la base de datos")
    cursor = None
    try:
        if isinstance(conn, sqlite3.Connection):
            conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
            cursor = conn.cursor()
        else:
            cursor = conn.cursor(dictionary=True)
        yield cursor
        if commit:
            conn.commit()
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if cursor:
            try:
                while cursor.nextset():
                    cursor.fetchall()
            except Exception:
                pass
            cursor.close()
        if _test_connection is None and conn is not None:
            conn.close()