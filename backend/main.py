import io
import sys
import code
from typing import Dict, Union, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path as PathlibPath


# MODELS
class CodeExecutionRequest(BaseModel):
    id: int
    code: str

# FASTAPI CONFIG
app = FastAPI()

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Contexts for storing and executing python code
active_contexts: Dict[int, code.InteractiveConsole] = {}

PROJECT_ROOT = PathlibPath(__file__).parent.parent
print(f"DEBUG: PROJECT_ROOT: {PROJECT_ROOT.resolve()}")


# Functions

# Handles create a new console (context)
def _create_new_interpreter() -> code.InteractiveConsole:
    return code.InteractiveConsole()

# Handles creating the entire context
def create_context(context_id: int) -> None:
    if context_id not in active_contexts:
        active_contexts[context_id] = _create_new_interpreter()

# Handles deleting the entire context
def delete_context(context_id: int) -> bool:
    if context_id in active_contexts:
        del active_contexts[context_id]
        return True
    return False

# Handles executing the code in a context
def execute_code_in_context(context_id: int, code_string: str) -> Dict[str, str]:
    if context_id not in active_contexts:
        return {
            "output": "",
            "error": f"Error: Context with ID '{context_id}' not found.",
            "success": "false"
        }

    interpreter = active_contexts[context_id]

    # Store current sys out until we're done with our own plug
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    old_displayhook = sys.displayhook 

    # Plug in the new one temporarily so we can listen to it
    redirected_output = io.StringIO()
    sys.stdout = redirected_output
    sys.stderr = redirected_output 

    # This is to get any statements that return a value but don't print it out
    def custom_displayhook(obj: Any) -> None:
        if obj is not None:
            sys.stdout.write(repr(obj) + '\n')

    sys.displayhook = custom_displayhook

    error_message = "" 
    
    # Ensure the code string ends with a newline to properly flush the last line/statement
    if not code_string.endswith('\n'):
        code_string += '\n'

    lines = code_string.splitlines(keepends=True)

    try:
        for line in lines:
            interpreter.push(line) 

        # If this works, it means we were in a statement that has yet to close (This is after having read through all the given lines)
        if interpreter.push(''):
            error_message = "Error: The code block is incomplete (e.g., an unclosed 'if', 'for', or function definition)."

    except Exception as e:
        error_message = f"Error: {type(e).__name__}: {e}"

    finally:
        # Give it back it's original system variables
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        sys.displayhook = old_displayhook

    captured_output = redirected_output.getvalue()

    return {
        "output": captured_output if captured_output else "Execution successful (no output).",
        "error": error_message,
        "success": "true" if not error_message else "false"
    }


# End Points

# Debug
@app.get("/")
async def root(ping: str = None):
    if ping and ping.lower() == "ping":
        return {"ping": "pong"}
    else:
        return {"status": "Backend running."}

# To run code
@app.post("/execute_code")
async def api_execute_code(request: CodeExecutionRequest) -> Dict[str, str]:
    context_id = request.id
    code_string = request.code

    if context_id not in active_contexts:
        print(f"Warning: Context ID {context_id} not found, auto-creating for execution.")
        create_context(context_id)

    result = execute_code_in_context(context_id, code_string)
    return result

# Delete a context, though when the website refreshes contexts don't get deleted still. Bit useless at the end.
@app.post("/delete_context")
async def api_delete_context(id: int) -> Dict[str, Union[int, str]]:
    if not delete_context(id):
        raise HTTPException(status_code=404, detail=f"Context with ID '{id}' not found. Cannot delete.")
    return {"context_id": id, "message": f"Context with ID '{id}' deleted successfully."}
