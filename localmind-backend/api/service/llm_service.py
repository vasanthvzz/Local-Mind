import json
import copy
import httpx
from api.service.prompt_service import PromptService
from api.config import settings
from db.schema.enums import ConversationType

class LLMService:
    def __init__(self, db):
        self.base_url = settings.LLM_BASE_URL
        self.model = settings.LLM_MODEL
        self.temperature = settings.LLM_TEMPERATURE
        self.max_tokens = settings.LLM_MAX_TOKENS
        self.prompt_service = PromptService()

    async def get_result(self, message: str,conversation_type: ConversationType, history: list = [], context: str = ""):
        try:
            messages = copy.deepcopy(history)
            instruction = self.prompt_service.get_instruction(conversation_type)
            full_system_content = f"Instruction:\n{instruction}"
            if context:
                full_system_content += f"\n\nContext:\n{context}"
                if messages and messages[0]['role'] == 'system':
                    messages[0]['content'] = full_system_content
                else:
                    messages.insert(0, {"role": "system", "content": full_system_content})

            if message:
                if not messages or messages[-1]['content'] != message:
                    messages.append({"role": "user", "content": message})

            async with httpx.AsyncClient(timeout=300) as client:
                async with client.stream(
                        "POST",
                        f"{self.base_url}/api/chat",
                        json={
                            "model": self.model,
                            "messages": messages,
                            "stream": True,
                        }
                ) as response:
                    if response.status_code != 200:
                        raise Exception(f"Ollama API error: {response.status_code}")

                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                chunk = json.loads(line)
                                if "message" in chunk and "content" in chunk["message"]:
                                    content = chunk["message"]["content"]
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
        except httpx.ConnectError:
            print("ERROR: Cannot connect to Ollama")
            raise Exception(
                "Cannot connect to Ollama. Make sure Ollama is running: "
                "Run 'ollama serve' in terminal"
            )
        except Exception as e:
            print(f"LLM streaming error: {e}")
            raise Exception(f"Failed to generate streaming response: {str(e)}")

