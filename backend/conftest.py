import sys
import os
import tempfile

sys.path.insert(0, os.path.dirname(__file__))

# Keep API tests isolated from a developer's real/persistent database. This is
# set before test modules import app.database and construct the SQLAlchemy engine.
_test_data_dir = tempfile.mkdtemp(prefix="signbridge-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_test_data_dir, 'signbridge.db')}"
