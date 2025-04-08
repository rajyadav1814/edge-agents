"""
Unit tests for the config module.

These tests verify the functionality of the configuration management
functions and classes without modifying actual configuration files.
"""

import os
import pytest
from unittest.mock import patch, mock_open, MagicMock
import json
import yaml

from src.core.config import (
    Config,
    get_config
)


class TestConfigFunctions:
    """Tests for standalone config functions."""
    
    def test_merge_configs(self):
        """
        This test has been removed as the merge_configs function
        is not part of the actual implementation.
        """
        pass


class TestConfig:
    """Tests for the Config class."""
    
    @patch("os.path.exists", return_value=True)
    @patch("builtins.open", new_callable=mock_open, read_data='{"test": "value"}')
    @patch("json.load")
    @patch("yaml.safe_load")
    def test_init_with_default_paths(self, mock_yaml_load, mock_json_load, mock_file, mock_exists):
        """Test initialization with default config paths."""
        # Mock the json.load to return a test config
        mock_json_load.return_value = {"test": "value"}
        
        manager = Config()
        
        # Verify that all default config files were checked
        assert mock_exists.call_count >= 3
        
        # We can't easily verify the exact config since it depends on which
        # mock files exist and in what order they're loaded
        assert isinstance(manager.config, dict)
    
    def test_get_value(self):
        """Test getting values from the config."""
        manager = Config()
        manager.config = {
            "aws": {
                "region": "us-east-1",
                "tags": {
                    "Environment": "dev"
                }
            },
            "string_value": "test"
        }
        
        # Test getting nested value
        assert manager.get("aws.region") == "us-east-1"
        assert manager.get("aws.tags.Environment") == "dev"
        
        # Test getting top-level value
        assert manager.get("string_value") == "test"
        
        # Test getting non-existent value with default
        assert manager.get("missing.key", default="default") == "default"
        
        # Test getting non-existent value without default
        assert manager.get("missing.key") is None
    
    def test_set_value(self):
        """Test setting values in the config."""
        manager = Config()
        manager.config = {
            "aws": {
                "region": "us-east-1"
            }
        }
        
        # Test setting existing value
        manager.set("aws.region", "eu-west-1")
        assert manager.config["aws"]["region"] == "eu-west-1"
        
        # Test setting new nested value
        manager.set("aws.tags.Project", "test")
        assert manager.config["aws"]["tags"]["Project"] == "test"
        
        # Test setting new top-level value
        manager.set("new_section", {"key": "value"})
        assert manager.config["new_section"]["key"] == "value"
    
    @patch("os.makedirs")
    @patch("builtins.open", new_callable=mock_open)
    @patch("json.dump")
    def test_save_config(self, mock_json_dump, mock_file, mock_makedirs):
        """Test saving the config to a file."""
        manager = Config()
        manager.config = {"test": "config"}
        
        manager.save("/path/to/config.json")
        
        # Verify that the directory was created
        mock_makedirs.assert_called_once_with(os.path.dirname("/path/to/config.json"), exist_ok=True)
        
        # Verify that the file was opened and written to
        assert mock_file.call_args_list[-1] == ((("/path/to/config.json", "w"),))
        mock_json_dump.assert_called_once()
        assert mock_json_dump.call_args[0][0] == {"test": "config"}


# Reset the singleton before test
@patch("src.core.config._config", None)
@patch("src.core.config.Config")
def test_get_config(mock_config_class):
    """Test the get_config singleton function."""
    # Mock the Config instance
    mock_instance = MagicMock()
    mock_config_class.return_value = mock_instance
    
    # First call should create a new instance
    config1 = get_config()
    mock_config_class.assert_called_once()
    assert config1 is mock_instance
    
    # Reset the mock to verify second call
    mock_config_class.reset_mock()
    
    # Second call should return the same instance
    config2 = get_config()
    mock_config_class.assert_not_called()
    
    # Both variables should reference the same object
    assert config1 is config2