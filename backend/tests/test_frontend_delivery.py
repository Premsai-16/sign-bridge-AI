import asyncio
import pytest
from starlette.exceptions import HTTPException
from app.main import FrontendFiles


def test_client_routes_load_but_missing_assets_and_api_remain_404(tmp_path):
    (tmp_path / 'index.html').write_text('<html>SignBridge</html>')
    files = FrontendFiles(directory=tmp_path, html=True)
    for route in ('login', 'conversation', 'learn'):
        response = asyncio.run(files.get_response(route, {'method': 'GET', 'headers': []}))
        assert response.status_code == 200
        assert str(response.path).endswith('index.html')
    for route in ('api/v1/missing', 'assets/missing.js', 'audio/missing.wav', '../private.env'):
        with pytest.raises(HTTPException) as error:
            asyncio.run(files.get_response(route, {'method': 'GET', 'headers': []}))
        assert error.value.status_code == 404
