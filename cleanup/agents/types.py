# Mock agents.types module

class RunContext:
    """Mock RunContext class."""
    def __init__(self, *args, **kwargs):
        pass

class RunContextWrapper:
    """Mock RunContextWrapper class."""
    def __init__(self, context=None):
        self.context = context

# Add other necessary mock classes
class Agent:
    """Mock Agent class."""
    def __init__(self, name=None, instructions=None, tools=None, model=None, handoffs=None):
        self.name = name
        self.instructions = instructions
        self.tools = tools or []
        self.model = model
        self.handoffs = handoffs or []

class Runner:
    """Mock Runner class."""
    @staticmethod
    def run(*args, **kwargs):
        pass
    
    @staticmethod
    def run_sync(*args, **kwargs):
        pass

def function_tool(*args, **kwargs):
    """Mock function_tool decorator."""
    def decorator(func):
        func.on_invoke_tool = func
        return func
    return decorator

class Handoff:
    """Mock Handoff class."""
    def __init__(self, agent=None, description=None):
        self.agent = agent
        self.description = description

class GuardrailFunctionOutput:
    """Mock GuardrailFunctionOutput class."""
    def __init__(self, tripwire_triggered=False, output_info=None):
        self.tripwire_triggered = tripwire_triggered
        self.output_info = output_info

def input_guardrail(*args, **kwargs):
    """Mock input_guardrail decorator."""
    def decorator(func):
        return func
    return decorator

def output_guardrail(*args, **kwargs):
    """Mock output_guardrail decorator."""
    def decorator(func):
        return func
    return decorator

def trace(*args, **kwargs):
    """Mock trace context manager."""
    class MockTrace:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
    return MockTrace()