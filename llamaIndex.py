
import os
from llama_index.core import Settings
from llama_index.llms.anthropic import Anthropic
from llama_index.indices.managed.llama_cloud import LlamaCloudIndex

llama_cloud_key = "llx-EpQ7C8aASSGknc34jqjyrbvRstuOTulXnoWmSIQHFyZOlx8r"

# Configure Claude LLM
llm = Anthropic(
    model="claude-3-haiku-20240307",
    api_key="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",
    temperature=0.7,
    max_tokens=200
)

# System prompt for non-technical, friendly responses
SYSTEM_PROMPT = """You are a friendly and helpful assistant for Zygotrix, an interactive genetics learning platform.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. Write in a warm, conversational tone like you're talking to a friend
2. Keep responses SHORT - maximum 2-4 sentences
3. Use SIMPLE language that anyone can understand (no jargon)
4. Focus ONLY on what Zygotrix helps users learn and do
5. NEVER mention technical terms like: React, TypeScript, API, database, C++, frameworks, etc.
6. NEVER copy documentation formatting or bullet points
7. Use everyday analogies when explaining genetics concepts
8. Be enthusiastic and encouraging about learning

Example good response: "Zygotrix is an online platform that makes learning genetics fun and interactive! You can take courses on topics like DNA and inheritance, practice with quizzes, and even run virtual experiments to see how genes work."

Example BAD response: "Zygotrix is built with React 19.1.1 and features: - Course management - API integration..." (too technical!)"""

# ---------------------------------------------------------
# 3. CONNECT TO THE "MEMORY" (LlamaCloud)
# ---------------------------------------------------------
try:
    index = LlamaCloudIndex(
      name="Zygotrix",
      project_name="Default",
      organization_id="7e4d6187-f46d-4435-a999-768d5c727cf1",
      api_key=llama_cloud_key,
      base_url="https://api.cloud.eu.llamaindex.ai",
    )
    print("✅ Connected to LlamaCloud Index successfully.")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit()

# Get retriever for fetching relevant documents
retriever = index.as_retriever(similarity_top_k=3)

# ---------------------------------------------------------
# 4. START THE CHATBOT LOOP
# ---------------------------------------------------------
print("\n--- ZYGOTRIX BOT (Type 'exit' to quit) ---\n")

while True:
    user_input = input("You: ")
    
    if user_input.lower() in ['exit', 'quit', 'q']:
        print("Goodbye!")
        break
        
    try:
        # Step 1: Retrieve relevant documents from LlamaCloud
        retrieved_nodes = retriever.retrieve(user_input)
        
        # Step 2: Combine retrieved context
        context = "\n\n".join([node.get_content() for node in retrieved_nodes])

        # Step 3: Generate response using Cohere LLM with Chat API
        from llama_index.core.llms import ChatMessage

        messages = [
            ChatMessage(role="system", content=SYSTEM_PROMPT),
            ChatMessage(role="user", content=f"""Background information (use this to answer, but don't copy it directly):
{context}

Question: {user_input}

Remember: Answer in 2-4 simple, friendly sentences. No technical jargon. No bullet points. Just talk naturally like you're explaining to a friend.""")
        ]

        response = llm.chat(messages)

        print(f"Bot: {response.message.content}\n")
        
    except Exception as e:
        print(f"Error: {e}")