"""
Script to run all CLI tests.
"""

import unittest
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

# Import test modules
from tests.custom.test_cli_format import TestCLIFormatOutput as SimpleFormatTests
from tests.custom.test_cli import (
    TestCLIFormatOutput, 
    TestCLIEC2Commands, 
    TestCLIGitHubCommands
)
from tests.custom.test_error_handling import TestCLIErrorHandling

def run_all_tests():
    """Run all CLI tests."""
    # Create a test suite
    test_suite = unittest.TestSuite()
    test_loader = unittest.TestLoader()
    
    # Add tests from test_cli_format.py
    test_suite.addTest(test_loader.loadTestsFromTestCase(SimpleFormatTests))
    
    # Add tests from test_cli.py
    test_suite.addTest(test_loader.loadTestsFromTestCase(TestCLIFormatOutput))
    test_suite.addTest(test_loader.loadTestsFromTestCase(TestCLIEC2Commands))
    test_suite.addTest(test_loader.loadTestsFromTestCase(TestCLIGitHubCommands))
    
    # Add tests from test_error_handling.py
    test_suite.addTest(test_loader.loadTestsFromTestCase(TestCLIErrorHandling))
    
    # Run the tests
    test_runner = unittest.TextTestRunner(verbosity=2)
    result = test_runner.run(test_suite)
    
    # Return appropriate exit code
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_all_tests())