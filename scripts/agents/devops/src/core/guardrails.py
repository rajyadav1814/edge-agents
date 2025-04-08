"""
Guardrails Module - Provides security and safety guardrails for DevOps agent operations.

This module implements guardrails to prevent potentially harmful operations,
detect sensitive information, and ensure secure agent behavior.
"""

import re
import logging
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field

from agents import Agent, Runner, GuardrailFunctionOutput
from agents.types import (
    RunContext,
    InputGuardrail,
    OutputGuardrail,
    InputGuardrailFunction,
    OutputGuardrailFunction
)

# Configure logging
logger = logging.getLogger(__name__)


class SecurityCheckOutput(BaseModel):
    """Output model for security check guardrail."""
    is_malicious: bool = Field(
        description="Whether the input is potentially malicious"
    )
    reasoning: str = Field(
        description="Reasoning for the security determination"
    )


class SensitiveInfoOutput(BaseModel):
    """Output model for sensitive information check guardrail."""
    contains_sensitive_info: bool = Field(
        description="Whether the output contains sensitive information"
    )
    reasoning: str = Field(
        description="Reasoning for the sensitive information determination"
    )


def check_security(input_text: str) -> SecurityCheckOutput:
    """
    Check if input text contains potentially malicious content.
    
    Args:
        input_text: The text to check
        
    Returns:
        SecurityCheckOutput with determination and reasoning
    """
    # List of dangerous patterns to check for
    dangerous_patterns = [
        # Destructive operations
        r"delete\s+all",
        r"remove\s+all",
        r"drop\s+(database|table)",
        r"truncate\s+(database|table)",
        r"wipe\s+(disk|drive|volume|instance|server)",
        r"format\s+(disk|drive|volume)",
        
        # Potentially harmful AWS operations
        r"terminate\s+all\s+instances",
        r"delete\s+(bucket|cluster|vpc|subnet)",
        r"remove\s+all\s+security\s+groups",
        
        # Potentially harmful GitHub operations
        r"delete\s+all\s+(repos|repositories)",
        r"remove\s+all\s+collaborators",
        r"delete\s+organization",
        
        # Suspicious commands
        r"rm\s+-rf\s+/",
        r"sudo\s+rm",
        r"chmod\s+777",
        r":(){ :\|:& };:",  # Fork bomb
    ]
    
    # Check for dangerous patterns
    for pattern in dangerous_patterns:
        if re.search(pattern, input_text.lower()):
            return SecurityCheckOutput(
                is_malicious=True,
                reasoning=f"Input contains potentially dangerous pattern: '{pattern}'"
            )
    
    # Check for excessive scope
    excessive_scope_patterns = [
        r"all\s+regions",
        r"all\s+accounts",
        r"all\s+resources",
        r"all\s+instances",
        r"all\s+databases",
        r"all\s+repositories",
    ]
    
    for pattern in excessive_scope_patterns:
        if re.search(pattern, input_text.lower()):
            # If combined with destructive operations, flag as malicious
            for dangerous in ["delete", "remove", "terminate", "stop", "kill"]:
                if dangerous in input_text.lower():
                    return SecurityCheckOutput(
                        is_malicious=True,
                        reasoning=f"Input combines excessive scope '{pattern}' with destructive operation '{dangerous}'"
                    )
    
    # If no dangerous patterns found, consider safe
    return SecurityCheckOutput(
        is_malicious=False,
        reasoning="Input does not contain known dangerous patterns"
    )


def check_sensitive_info(output_text: str) -> SensitiveInfoOutput:
    """
    Check if output text contains sensitive information.
    
    Args:
        output_text: The text to check
        
    Returns:
        SensitiveInfoOutput with determination and reasoning
    """
    # Patterns for sensitive information
    sensitive_patterns = {
        "AWS Access Key": r"(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])",
        "AWS Secret Key": r"(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])",
        "AWS Session Token": r"(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{16,}(?![A-Za-z0-9/+=])",
        "SSH Private Key": r"-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH)\s+PRIVATE\s+KEY",
        "GitHub Token": r"(?:github|gh)(?:_pat|_token|_secret)?['\"][0-9a-zA-Z_]{36,}['\"]",
        "API Key": r"api[_-]?key['\"][0-9a-zA-Z]{32,}['\"]",
        "Password": r"password['\"][^'\"]{8,}['\"]",
        "IP Address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
        "Email Address": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    }
    
    # Check for sensitive patterns
    for name, pattern in sensitive_patterns.items():
        matches = re.findall(pattern, output_text)
        if matches:
            # For IP addresses, only flag private IPs as sensitive
            if name == "IP Address":
                private_ips = [
                    ip for ip in matches 
                    if ip.startswith(("10.", "172.", "192.168."))
                ]
                if not private_ips:
                    continue
            
            # For email addresses, only flag if combined with other sensitive info
            if name == "Email Address" and len(matches) == 1:
                continue
                
            return SensitiveInfoOutput(
                contains_sensitive_info=True,
                reasoning=f"Output contains sensitive information: {name}"
            )
    
    # Check for explicit mentions of credentials
    credential_mentions = [
        "access key", "secret key", "private key", "api key", 
        "token", "password", "credential", "secret"
    ]
    
    for mention in credential_mentions:
        if mention in output_text.lower():
            # Look for patterns that suggest actual credentials are present
            lines = output_text.lower().split("\n")
            for line in lines:
                if mention in line and any(char in line for char in "=:"):
                    return SensitiveInfoOutput(
                        contains_sensitive_info=True,
                        reasoning=f"Output appears to contain {mention}"
                    )
    
    # If no sensitive information found
    return SensitiveInfoOutput(
        contains_sensitive_info=False,
        reasoning="Output does not contain known patterns of sensitive information"
    )


async def security_guardrail_function(
    ctx: RunContext,
    agent: Agent, 
    input_text: str
) -> GuardrailFunctionOutput:
    """
    Security guardrail to prevent potentially harmful operations.
    
    Args:
        ctx: Run context
        agent: The agent being guarded 
        input_text: User input to check
        
    Returns:
        GuardrailFunctionOutput with security check results
    """
    logger.info(f"Running security guardrail for agent: {agent.name}")
    
    # Check if input contains potentially malicious content
    security_check = check_security(input_text)
    
    if security_check.is_malicious:
        logger.warning(f"Security guardrail triggered: {security_check.reasoning}")
        
        # Return guardrail output with tripwire triggered
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info=security_check,
            message="I cannot perform this operation as it appears to be potentially harmful. "
                   f"Reason: {security_check.reasoning}. Please modify your request to be more "
                   "specific and avoid operations that could cause widespread damage."
        )
    
    # If input is safe, allow it to proceed
    return GuardrailFunctionOutput(
        tripwire_triggered=False,
        output_info=security_check
    )


async def sensitive_info_guardrail_function(
    ctx: RunContext,
    agent: Agent, 
    output_text: str
) -> GuardrailFunctionOutput:
    """
    Sensitive information guardrail to prevent leaking sensitive data.
    
    Args:
        ctx: Run context
        agent: The agent being guarded 
        output_text: Agent output to check
        
    Returns:
        GuardrailFunctionOutput with sensitive information check results
    """
    logger.info(f"Running sensitive information guardrail for agent: {agent.name}")
    
    # Check if output contains sensitive information
    sensitive_check = check_sensitive_info(output_text)
    
    if sensitive_check.contains_sensitive_info:
        logger.warning(f"Sensitive information guardrail triggered: {sensitive_check.reasoning}")
        
        # Return guardrail output with tripwire triggered
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info=sensitive_check,
            message="I've detected sensitive information in my response and have redacted it for security. "
                   "Please be cautious about requesting sensitive data such as credentials, tokens, or private keys."
        )
    
    # If output doesn't contain sensitive information, allow it to proceed
    return GuardrailFunctionOutput(
        tripwire_triggered=False,
        output_info=sensitive_check
    )


# Create guardrail instances
security_guardrail = InputGuardrail(
    guardrail_function=security_guardrail_function,
    name="security_guardrail"
)

sensitive_info_guardrail = OutputGuardrail(
    guardrail_function=sensitive_info_guardrail_function,
    name="sensitive_info_guardrail"
)