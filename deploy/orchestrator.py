#!/usr/bin/env python3
"""
BGPalerter Deployment Orchestrator
Adapted from PDeploy architecture for basic deployment automation
"""

import json
import subprocess
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional

class DeploymentOrchestrator:
    """Orchestrates BGPalerter deployment modules"""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.modules_path = self.base_path / "modules"
        self.results = []
        
    def get_module_path(self, module_name: str) -> Optional[Path]:
        """Find the module script path"""
        module_path = self.modules_path / f"{module_name}.sh"
        if module_path.exists():
            return module_path
        return None
    
    def execute_module(self, module_name: str) -> Dict:
        """Execute a single module and return results"""
        module_path = self.get_module_path(module_name)
        
        if not module_path:
            return {
                "module": module_name,
                "status": "error",
                "progress": 0,
                "message": "Module not found",
                "logs": f"Could not find module script for {module_name}"
            }
        
        try:
            # Execute the module script
            result = subprocess.run(
                [str(module_path)],
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            
            # Try to parse JSON output from last line
            try:
                output = json.loads(result.stdout.strip().split('\n')[-1])
                output["module"] = module_name
                return output
            except json.JSONDecodeError:
                # If JSON parsing fails, return raw output
                return {
                    "module": module_name,
                    "status": "error" if result.returncode != 0 else "success",
                    "progress": 100 if result.returncode == 0 else 0,
                    "message": "Execution completed" if result.returncode == 0 else "Execution failed",
                    "logs": result.stdout + "\n" + result.stderr
                }
                
        except subprocess.TimeoutExpired:
            return {
                "module": module_name,
                "status": "error",
                "progress": 0,
                "message": "Module execution timed out",
                "logs": "Execution exceeded 10 minute timeout"
            }
        except Exception as e:
            return {
                "module": module_name,
                "status": "error",
                "progress": 0,
                "message": f"Execution error: {str(e)}",
                "logs": str(e)
            }
    
    def execute_modules(self, module_names: List[str]) -> List[Dict]:
        """Execute multiple modules sequentially"""
        for module_name in module_names:
            print(f"\n{'='*60}")
            print(f"Executing module: {module_name}")
            print('='*60)
            
            result = self.execute_module(module_name)
            self.results.append(result)
            
            # Print result
            print(f"Status: {result['status']}")
            print(f"Progress: {result['progress']}%")
            print(f"Message: {result['message']}")
            
            # Stop on error
            if result['status'] == 'error':
                print(f"\n❌ Module {module_name} failed. Stopping deployment.")
                print(f"Logs:\n{result['logs']}")
                break
            else:
                print(f"✅ Module {module_name} completed successfully")
        
        return self.results
    
    def print_summary(self):
        """Print deployment summary"""
        print(f"\n{'='*60}")
        print("DEPLOYMENT SUMMARY")
        print('='*60)
        
        total = len(self.results)
        successful = sum(1 for r in self.results if r['status'] == 'success')
        failed = sum(1 for r in self.results if r['status'] == 'error')
        
        print(f"Total modules: {total}")
        print(f"Successful: {successful}")
        print(f"Failed: {failed}")
        print()
        
        for result in self.results:
            status_icon = "✅" if result['status'] == 'success' else "❌"
            print(f"{status_icon} {result['module']}: {result['message']}")
        
        if failed == 0:
            print(f"\n🎉 All modules deployed successfully!")
            return 0
        else:
            print(f"\n⚠️  Deployment completed with errors")
            return 1

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: ./orchestrator.py <module1> <module2> ...")
        print("\nAvailable modules:")
        print("  - docker        Install Docker")
        print("  - nodejs        Install Node.js 22")
        print("  - pnpm          Install pnpm")
        print("  - pm2           Install PM2")
        print("  - bgpalerter    Deploy BGPalerter backend")
        print("  - dashboard     Deploy BGPalerter dashboard")
        sys.exit(1)
    
    modules = sys.argv[1:]
    
    print("BGPalerter Deployment Orchestrator")
    print(f"Modules to deploy: {', '.join(modules)}")
    
    orchestrator = DeploymentOrchestrator()
    orchestrator.execute_modules(modules)
    exit_code = orchestrator.print_summary()
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
