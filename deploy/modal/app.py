# Scope MCP gateway on Modal.
#
# Deploy with:
#   modal deploy app.py
#
# Sets SCOPE_API_TOKEN from a Modal secret. Create the secret via:
#   modal secret create scope-api-token SCOPE_API_TOKEN=<your-token>

import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("nodejs", "npm")
    .pip_install([])
    .run_commands(
        "npm install -g @scope-bid/scope-mcp@1.0.0",
    )
)

app = modal.App("scope-mcp-gateway")


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("scope-api-token")],
    cpu=0.5,
    memory=512,
    # Keep one container always warm. Modal scales up under load.
    min_containers=1,
    timeout=600,
)
@modal.web_server(port=8080, startup_timeout=30)
def gateway():
    import subprocess

    subprocess.Popen(
        ["scope-mcp", "serve", "--port", "8080"],
        env={"SCOPE_API_BASE": "https://scope.bid", **__import__("os").environ},
    )
