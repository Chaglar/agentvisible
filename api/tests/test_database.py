"""
Tests for database operations
Supabase integration for scan storage and retrieval
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch

from database import Database, save_scan, get_report
from models import Check, ModuleResult, ScanResult


class TestDatabase:
    """Test database operations with mocked Supabase client"""

    def test_extract_domain(self):
        """Test domain extraction from URLs"""
        db = Database.__new__(Database)  # Create without calling __init__

        # Test normal URLs
        assert db._extract_domain("https://example.com/path") == "example.com"
        assert db._extract_domain("https://www.example.com") == "example.com"
        assert db._extract_domain("http://subdomain.example.com") == "subdomain.example.com"

        # Test edge cases
        assert db._extract_domain("https://example.com:8080/path") == "example.com:8080"
        assert db._extract_domain("example.com") == "example.com"

    def test_record_to_scan_result(self):
        """Test conversion of database record to ScanResult"""
        db = Database.__new__(Database)  # Create without calling __init__

        # Mock database record
        record = {
            "url": "https://example.com",
            "domain": "example.com",
            "slug": "example-com-20231201",
            "overall_score": 75.5,
            "rating": "Strong",
            "modules": '[{"module": "structured_data", "score": 80.0, "weight": 0.30, "checks": [{"name": "Test Check", "passed": true, "severity": "info", "detail": "Test detail", "fix_hint": null}], "summary": "Test summary"}]',
            "top_fixes": '[{"name": "Fix This", "passed": false, "severity": "critical", "detail": "Critical issue", "fix_hint": "Fix it"}]',
            "created_at": "2023-12-01T10:00:00Z"
        }

        result = db._record_to_scan_result(record)

        assert isinstance(result, ScanResult)
        assert result.url == "https://example.com"
        assert result.overall_score == 75.5
        assert result.rating == "Strong"
        assert result.report_slug == "example-com-20231201"
        assert len(result.modules) == 1
        assert len(result.top_fixes) == 1

        # Test module reconstruction
        module = result.modules[0]
        assert module.module == "structured_data"
        assert module.score == 80.0
        assert module.weight == 0.30
        assert len(module.checks) == 1

        # Test check reconstruction
        check = module.checks[0]
        assert check.name == "Test Check"
        assert check.passed == True
        assert check.severity == "info"
        assert check.fix_hint is None

    @pytest.mark.asyncio
    @patch('database.create_client')
    async def test_save_scan(self, mock_create_client):
        """Test saving scan results to database"""
        # Mock Supabase client
        mock_client = Mock()
        mock_table = Mock()
        mock_upsert = Mock()
        mock_execute = Mock()

        mock_create_client.return_value = mock_client
        mock_client.table.return_value = mock_table
        mock_table.upsert.return_value = mock_upsert
        mock_upsert.execute.return_value.data = [{"id": "test-id"}]

        # Create test scan result
        scan_result = _create_test_scan_result()

        # Test save operation
        with patch.dict('os.environ', {'SUPABASE_URL': 'test-url', 'SUPABASE_KEY': 'test-key'}):
            db = Database()
            await db.save_scan(scan_result)

            # Verify calls
            mock_client.table.assert_called_with("scans")
            mock_table.upsert.assert_called_once()

            # Check upsert data
            call_args = mock_table.upsert.call_args[0][0]
            assert call_args["url"] == scan_result.url
            assert call_args["domain"] == "example.com"
            assert call_args["slug"] == scan_result.report_slug
            assert call_args["overall_score"] == scan_result.overall_score
            assert call_args["rating"] == scan_result.rating

    @pytest.mark.asyncio
    @patch('database.create_client')
    async def test_get_report(self, mock_create_client):
        """Test retrieving scan results by slug"""
        # Mock Supabase client
        mock_client = Mock()
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()
        mock_execute = Mock()

        mock_create_client.return_value = mock_client
        mock_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq

        # Test case: report found
        mock_execute.data = [{
            "url": "https://example.com",
            "domain": "example.com",
            "slug": "test-slug",
            "overall_score": 75.0,
            "rating": "Strong",
            "modules": '[{"module": "structured_data", "score": 80.0, "weight": 0.30, "checks": [], "summary": "Test"}]',
            "top_fixes": '[]',
            "created_at": "2023-12-01T10:00:00Z"
        }]
        mock_eq.execute.return_value = mock_execute

        with patch.dict('os.environ', {'SUPABASE_URL': 'test-url', 'SUPABASE_KEY': 'test-key'}):
            db = Database()
            result = await db.get_report("test-slug")

            assert result is not None
            assert result.url == "https://example.com"
            assert result.report_slug == "test-slug"

        # Test case: report not found
        mock_execute.data = []
        with patch.dict('os.environ', {'SUPABASE_URL': 'test-url', 'SUPABASE_KEY': 'test-key'}):
            db = Database()
            result = await db.get_report("nonexistent-slug")

            assert result is None

    @pytest.mark.asyncio
    async def test_convenience_functions(self):
        """Test module-level convenience functions"""
        scan_result = _create_test_scan_result()

        # Test with mocked database
        with patch('database.db') as mock_db:
            mock_db.save_scan = Mock()
            mock_db.get_report = Mock(return_value=scan_result)

            # Test save_scan
            await save_scan(scan_result)
            mock_db.save_scan.assert_called_once_with(scan_result)

            # Test get_report
            result = await get_report("test-slug")
            mock_db.get_report.assert_called_once_with("test-slug")
            assert result == scan_result


class TestDatabaseIntegration:
    """Integration tests for database endpoints"""

    def test_scan_endpoint_with_database(self):
        """Test that scan endpoint saves to database"""
        from fastapi.testclient import TestClient
        from main import app

        with patch('database.save_scan') as mock_save:
            mock_save.return_value = None

            client = TestClient(app)
            response = client.post(
                "/api/v1/scan",
                json={"url": "https://httpbin.org/html"}
            )

            if response.status_code == 200:
                # Verify save_scan was called
                mock_save.assert_called_once()

    def test_report_endpoint_with_database(self):
        """Test report retrieval endpoint"""
        from fastapi.testclient import TestClient
        from main import app

        scan_result = _create_test_scan_result()

        with patch('database.get_report') as mock_get:
            # Test found case
            mock_get.return_value = scan_result

            client = TestClient(app)
            response = client.get("/api/v1/report/test-slug")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert "data" in data

            # Test not found case
            mock_get.return_value = None
            response = client.get("/api/v1/report/nonexistent")

            assert response.status_code == 404


def _create_test_scan_result() -> ScanResult:
    """Create a test ScanResult for testing"""
    check = Check(
        name="Test Check",
        passed=True,
        severity="info",
        detail="Test check detail",
        fix_hint=None
    )

    module = ModuleResult(
        module="structured_data",
        score=80.0,
        weight=0.30,
        checks=[check],
        summary="Test module summary"
    )

    return ScanResult(
        url="https://example.com",
        overall_score=75.0,
        rating="Strong",
        modules=[module],
        top_fixes=[],
        scanned_at=datetime(2023, 12, 1, 10, 0, 0),
        report_slug="example-com-20231201"
    )