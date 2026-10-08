"""Minimal stdio MCP server for the runtime smoke: one `publish` tool that
records what it received and returns. No network. Speaks newline-delimited
JSON-RPC 2.0 (the stdio transport)."""
import json
import os
import sys

LOG = os.environ.get('CREW_SMOKE_MCP_LOG')


def reply(msg_id, result):
    sys.stdout.write(json.dumps({'jsonrpc': '2.0', 'id': msg_id, 'result': result}) + '\n')
    sys.stdout.flush()


for line in sys.stdin:
    if not line.strip():
        continue
    msg = json.loads(line)
    method, msg_id = msg.get('method'), msg.get('id')
    if method == 'initialize':
        reply(msg_id, {'protocolVersion': msg['params'].get('protocolVersion', '2025-06-18'),
                       'capabilities': {'tools': {}}, 'serverInfo': {'name': 'smokedocs', 'version': '1.0.0'}})
    elif method == 'tools/list':
        reply(msg_id, {'tools': [{'name': 'publish', 'description': 'Publish a document page.',
                                  'inputSchema': {'type': 'object', 'properties': {'title': {'type': 'string'}, 'content': {'type': 'string'}},
                                                  'required': ['content']}}]})
    elif method == 'tools/call':
        if LOG:
            with open(LOG, 'a', encoding='utf-8') as out:
                out.write(json.dumps(msg['params']) + '\n')
        reply(msg_id, {'content': [{'type': 'text', 'text': 'published'}]})
    elif msg_id is not None:
        reply(msg_id, {})
