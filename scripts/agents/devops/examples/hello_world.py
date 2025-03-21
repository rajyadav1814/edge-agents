"""
Hello World Example - Tests the basic import and usage of the OpenAI Agents SDK.
"""

import os
import asyncio
from agents import Agent, Runner

async def main():
    """Run a simple hello world agent."""
    # Set up the OpenAI API key
    if "OPENAI_API_KEY" not in os.environ:
        print("Please set the OPENAI_API_KEY environment variable")
        return
    
    # Create a simple agent
    agent = Agent(
        name="Hello World Agent",
        instructions="You are a friendly assistant that says hello to the user.",
        model="gpt-4o"
    )
    
    # Run the agent
    print("Running hello world agent...")
    result = await Runner.run(agent, "Say hello to me!")
    
    # Print the result
    print("\nFinal output:")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())