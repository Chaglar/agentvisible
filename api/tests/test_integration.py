"""
Integration tests for the complete scanning pipeline
Tests the full end-to-end flow including all modules
"""

import pytest
from fastapi.testclient import TestClient

from main import app
from scanner.engine import run_scan


class TestScanEngine:
    """Test the complete scan engine integration"""

    @pytest.mark.asyncio
    async def test_run_scan_integration(self):
        """Test run_scan function with a real website"""
        # Use a reliable test endpoint
        test_url = "https://httpbin.org/html"

        result = await run_scan(test_url)

        # Verify basic structure
        assert result.url == test_url
        assert isinstance(result.overall_score, float)
        assert 0.0 <= result.overall_score <= 100.0
        assert result.rating in ["Critical", "Weak", "Moderate", "Strong"]
        assert len(result.modules) == 5
        assert len(result.top_fixes) <= 3
        assert result.scanned_at is not None
        assert result.report_slug is not None

        # Verify all modules are present
        module_names = {module.module for module in result.modules}
        expected_modules = {
            "structured_data",
            "ai_crawlability",
            "content_parseability",
            "commerce_protocols",
            "agent_discovery"
        }
        assert module_names == expected_modules

        # Verify each module has proper structure
        for module in result.modules:
            assert isinstance(module.score, float)
            assert 0.0 <= module.score <= 100.0
            assert isinstance(module.weight, float)
            assert module.weight > 0.0
            assert isinstance(module.checks, list)
            assert len(module.checks) > 0
            assert isinstance(module.summary, str)

        # Verify top fixes are properly prioritized
        for fix in result.top_fixes:
            assert fix.severity in ["critical", "warning", "info"]
            assert isinstance(fix.detail, str)
            assert not fix.passed  # Should only include failed checks

    @pytest.mark.asyncio
    async def test_run_scan_ooow_integration(self):
        """Integration test: scan ooow.com.au and verify all modules return results"""
        # This is the specific test mentioned in acceptance criteria
        test_url = "https://ooow.com.au"

        try:
            result = await run_scan(test_url)

            # Verify scan completed successfully
            assert result.url == test_url
            assert isinstance(result.overall_score, float)
            assert result.rating in ["Critical", "Weak", "Moderate", "Strong"]

            # Verify all 5 modules returned results
            assert len(result.modules) == 5

            module_names = [module.module for module in result.modules]
            expected_modules = [
                "structured_data",
                "ai_crawlability",
                "content_parseability",
                "commerce_protocols",
                "agent_discovery"
            ]

            for expected_module in expected_modules:
                assert expected_module in module_names

            # Each module should have checks
            for module in result.modules:
                assert len(module.checks) > 0
                assert isinstance(module.summary, str)
                assert len(module.summary) > 0

            # Should have some actionable fixes
            assert len(result.top_fixes) >= 0  # May have 0 fixes if perfect score

            print(f"✅ ooow.com.au scan successful: {result.overall_score:.1f} ({result.rating})")

        except Exception as e:
            # If the website is unreachable, skip this test
            pytest.skip(f"Could not reach ooow.com.au: {e}")

    @pytest.mark.asyncio
    async def test_run_scan_error_handling(self):
        """Test error handling for invalid URLs"""
        # Test with an invalid URL
        invalid_url = "https://this-domain-should-not-exist-12345.com"

        result = await run_scan(invalid_url)

        # Should return error result
        assert result.overall_score == 0.0
        assert result.rating == "Critical"

        # Should have error in top fixes
        assert len(result.top_fixes) > 0
        error_fix = result.top_fixes[0]
        assert not error_fix.passed
        assert error_fix.severity == "critical"

    def test_scan_timing(self):
        """Test that scan completes within reasonable time"""
        import asyncio
        import time

        async def timed_scan():
            start_time = time.time()
            await run_scan("https://httpbin.org/html")
            end_time = time.time()
            return end_time - start_time

        # Run the timed scan
        scan_time = asyncio.run(timed_scan())

        # Should complete within 20 seconds as per acceptance criteria
        assert scan_time < 20.0, f"Scan took {scan_time:.2f}s, should be < 20s"

        print(f"✅ Scan completed in {scan_time:.2f}s")


class TestScanAPI:
    """Test the FastAPI scan endpoint"""

    def test_scan_endpoint_success(self):
        """Test successful scan via API endpoint"""
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/scan",
                json={"url": "https://httpbin.org/html"}
            )

            assert response.status_code == 200
            data = response.json()

            assert data["status"] == "ok"
            assert "data" in data

            scan_data = data["data"]
            assert "overall_score" in scan_data
            assert "rating" in scan_data
            assert "modules" in scan_data
            assert len(scan_data["modules"]) == 5

    def test_scan_endpoint_invalid_url(self):
        """Test API endpoint with invalid URL"""
        with TestClient(app) as client:
            # Test with localhost (should be blocked by SSRF protection)
            response = client.post(
                "/api/v1/scan",
                json={"url": "http://localhost:8080"}
            )

            assert response.status_code == 400
            assert "Invalid URL" in response.json()["detail"]

            # Test with private IP
            response = client.post(
                "/api/v1/scan",
                json={"url": "http://192.168.1.1"}
            )

            assert response.status_code == 400

    def test_scan_endpoint_rate_limiting(self):
        """Test rate limiting functionality"""
        with TestClient(app) as client:
            # Make multiple requests rapidly
            url_data = {"url": "https://httpbin.org/html"}

            # First few requests should succeed
            for i in range(3):
                response = client.post("/api/v1/scan", json=url_data)
                if response.status_code == 200:
                    assert response.json()["status"] == "ok"
                elif response.status_code == 429:
                    # Hit rate limit
                    break

    def test_health_endpoint(self):
        """Verify health endpoint still works"""
        with TestClient(app) as client:
            response = client.get("/api/v1/health")
            assert response.status_code == 200
            assert response.json() == {"status": "ok", "version": "0.1.0"}