"""
Automation Services for GARVIS OpenClaw
Provides browser automation, file operations, and system operations
"""

import asyncio
import os
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from playwright.async_api import async_playwright, Browser, Page
import json
import logging

logger = logging.getLogger(__name__)

# ============================================
# BROWSER AUTOMATION SERVICE
# ============================================

class BrowserService:
    """Browser automation using Playwright"""
    
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        
    async def start(self):
        """Initialize Playwright and browser"""
        if not self.browser:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            logger.info("Browser service started")
    
    async def stop(self):
        """Clean up browser resources"""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
            logger.info("Browser service stopped")
    
    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute browser automation action"""
        await self.start()
        
        context = await self.browser.new_context()
        page = await context.new_page()
        
        try:
            result = await self._execute_action(page, action, params)
            return {"success": True, "result": result}
        except Exception as e:
            logger.error(f"Browser action failed: {e}")
            return {"success": False, "error": str(e)}
        finally:
            await context.close()
    
    async def _execute_action(self, page: Page, action: str, params: Dict[str, Any]) -> Any:
        """Execute specific browser action"""
        
        if action == "navigate":
            url = params.get("url")
            await page.goto(url, wait_until="networkidle")
            return {"url": page.url, "title": await page.title()}
        
        elif action == "screenshot":
            url = params.get("url")
            await page.goto(url, wait_until="networkidle")
            screenshot_path = f"/tmp/screenshot_{os.urandom(8).hex()}.png"
            await page.screenshot(path=screenshot_path, full_page=params.get("full_page", False))
            return {"screenshot_path": screenshot_path, "url": page.url}
        
        elif action == "scrape":
            url = params.get("url")
            selector = params.get("selector", "body")
            await page.goto(url, wait_until="networkidle")
            
            if selector == "body":
                content = await page.content()
                text = await page.inner_text("body")
                return {"html": content[:5000], "text": text[:5000], "url": page.url}
            else:
                elements = await page.locator(selector).all()
                texts = [await el.inner_text() for el in elements[:10]]
                return {"texts": texts, "count": len(elements)}
        
        elif action == "click":
            url = params.get("url")
            selector = params.get("selector")
            await page.goto(url, wait_until="networkidle")
            await page.click(selector)
            await page.wait_for_load_state("networkidle")
            return {"url": page.url, "title": await page.title()}
        
        elif action == "fill_form":
            url = params.get("url")
            fields = params.get("fields", {})
            await page.goto(url, wait_until="networkidle")
            
            for selector, value in fields.items():
                await page.fill(selector, str(value))
            
            submit_button = params.get("submit_button")
            if submit_button:
                await page.click(submit_button)
                await page.wait_for_load_state("networkidle")
            
            return {"url": page.url, "title": await page.title(), "fields_filled": len(fields)}
        
        elif action == "extract_data":
            url = params.get("url")
            selectors = params.get("selectors", {})
            await page.goto(url, wait_until="networkidle")
            
            data = {}
            for key, selector in selectors.items():
                try:
                    element = page.locator(selector).first
                    data[key] = await element.inner_text()
                except Exception as e:
                    data[key] = f"Error: {str(e)}"
            
            return {"data": data, "url": page.url}
        
        else:
            raise ValueError(f"Unknown browser action: {action}")


# ============================================
# FILE OPERATIONS SERVICE
# ============================================

class FileService:
    """File operations with security controls"""
    
    ALLOWED_BASE_PATHS = ["/tmp", "/app/uploads", "/app/data"]
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    
    def __init__(self):
        # Ensure directories exist
        for path in self.ALLOWED_BASE_PATHS:
            Path(path).mkdir(parents=True, exist_ok=True)
    
    def _validate_path(self, file_path: str) -> Path:
        """Validate and resolve file path"""
        path = Path(file_path).resolve()
        
        # Check if path is within allowed directories
        allowed = any(str(path).startswith(base) for base in self.ALLOWED_BASE_PATHS)
        if not allowed:
            raise PermissionError(f"Access denied: {file_path} not in allowed paths")
        
        return path
    
    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute file operation"""
        try:
            if action == "read":
                path = self._validate_path(params.get("path"))
                
                if not path.exists():
                    raise FileNotFoundError(f"File not found: {path}")
                
                if path.stat().st_size > self.MAX_FILE_SIZE:
                    raise ValueError(f"File too large (max {self.MAX_FILE_SIZE} bytes)")
                
                content = path.read_text(encoding=params.get("encoding", "utf-8"))
                
                return {
                    "success": True,
                    "content": content,
                    "size": path.stat().st_size,
                    "path": str(path)
                }
            
            elif action == "write":
                path = self._validate_path(params.get("path"))
                content = params.get("content", "")
                
                if len(content.encode()) > self.MAX_FILE_SIZE:
                    raise ValueError(f"Content too large (max {self.MAX_FILE_SIZE} bytes)")
                
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding=params.get("encoding", "utf-8"))
                
                return {
                    "success": True,
                    "path": str(path),
                    "size": path.stat().st_size
                }
            
            elif action == "list":
                path = self._validate_path(params.get("path"))
                
                if not path.exists():
                    raise FileNotFoundError(f"Directory not found: {path}")
                
                if not path.is_dir():
                    raise ValueError(f"Not a directory: {path}")
                
                files = []
                for item in path.iterdir():
                    files.append({
                        "name": item.name,
                        "path": str(item),
                        "is_dir": item.is_dir(),
                        "size": item.stat().st_size if item.is_file() else 0
                    })
                
                return {"success": True, "files": files, "count": len(files)}
            
            elif action == "delete":
                path = self._validate_path(params.get("path"))
                
                if not path.exists():
                    raise FileNotFoundError(f"File not found: {path}")
                
                if path.is_dir():
                    import shutil
                    shutil.rmtree(path)
                else:
                    path.unlink()
                
                return {"success": True, "path": str(path), "deleted": True}
            
            elif action == "move":
                src_path = self._validate_path(params.get("source"))
                dst_path = self._validate_path(params.get("destination"))
                
                if not src_path.exists():
                    raise FileNotFoundError(f"Source not found: {src_path}")
                
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                src_path.rename(dst_path)
                
                return {
                    "success": True,
                    "source": str(src_path),
                    "destination": str(dst_path)
                }
            
            elif action == "copy":
                src_path = self._validate_path(params.get("source"))
                dst_path = self._validate_path(params.get("destination"))
                
                if not src_path.exists():
                    raise FileNotFoundError(f"Source not found: {src_path}")
                
                import shutil
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                
                if src_path.is_dir():
                    shutil.copytree(src_path, dst_path)
                else:
                    shutil.copy2(src_path, dst_path)
                
                return {
                    "success": True,
                    "source": str(src_path),
                    "destination": str(dst_path)
                }
            
            else:
                raise ValueError(f"Unknown file action: {action}")
                
        except Exception as e:
            logger.error(f"File operation failed: {e}")
            return {"success": False, "error": str(e)}


# ============================================
# SYSTEM OPERATIONS SERVICE (ADMIN ONLY)
# ============================================

class SystemService:
    """System operations with full shell access for admins"""
    
    def __init__(self):
        self.max_execution_time = 300  # 5 minutes
    
    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute system operation"""
        try:
            if action == "shell":
                command = params.get("command")
                timeout = min(params.get("timeout", 60), self.max_execution_time)
                
                # Execute command
                process = await asyncio.create_subprocess_shell(
                    command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=params.get("cwd", "/tmp")
                )
                
                try:
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                        timeout=timeout
                    )
                    
                    return {
                        "success": True,
                        "stdout": stdout.decode('utf-8', errors='ignore'),
                        "stderr": stderr.decode('utf-8', errors='ignore'),
                        "exit_code": process.returncode,
                        "command": command
                    }
                except asyncio.TimeoutError:
                    process.kill()
                    return {
                        "success": False,
                        "error": f"Command timed out after {timeout}s",
                        "command": command
                    }
            
            elif action == "system_info":
                # Get system information
                info = {
                    "cpu_count": os.cpu_count(),
                    "cwd": os.getcwd(),
                    "env_vars": len(os.environ),
                    "platform": os.uname()._asdict()
                }
                return {"success": True, "info": info}
            
            elif action == "process_list":
                # List running processes
                result = subprocess.run(
                    ["ps", "aux"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                return {
                    "success": True,
                    "processes": result.stdout.split('\n')[:50]  # First 50 processes
                }
            
            else:
                raise ValueError(f"Unknown system action: {action}")
                
        except Exception as e:
            logger.error(f"System operation failed: {e}")
            return {"success": False, "error": str(e)}


# ============================================
# SERVICE MANAGER
# ============================================

class ServiceManager:
    """Manages all automation services"""
    
    def __init__(self):
        self.browser_service = BrowserService()
        self.file_service = FileService()
        self.system_service = SystemService()
    
    async def cleanup(self):
        """Clean up all services"""
        await self.browser_service.stop()


# Global service manager
service_manager = ServiceManager()
