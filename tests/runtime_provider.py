import json
from http.server import BaseHTTPRequestHandler

RUN = None
counts = {"claude": 0, "codex": 0}
# Scenario plans: host -> list of callables(body) returning the next response.
# Claude steps return an Anthropic content block; Codex steps return a
# Responses API output item, or (item, usage) to report a custom usage. An empty
# plan keeps the original smoke behavior below. PREFIX names request files.
PLANS = {"claude": None, "codex": None}
PREFIX = {"claude": "claude", "codex": "codex"}


def use(host, steps, prefix):
    PLANS[host] = steps
    PREFIX[host] = prefix
    counts[host] = 0


def text(value):
    return {'type': 'text', 'text': value}


def message(value):
    return {'type': 'message', 'id': 'message_end', 'role': 'assistant', 'status': 'completed',
            'content': [{'type': 'output_text', 'text': value, 'annotations': []}]}


def function_call(name, arguments, call_id):
    return {'type': 'function_call', 'id': 'fc_' + call_id, 'call_id': call_id, 'name': name,
            'arguments': json.dumps(arguments), 'status': 'completed'}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length', '0'))) or b'{}')
        if 'count_tokens' in self.path:
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers()
            self.wfile.write(b'{"input_tokens":100}'); return
        host = 'claude' if 'messages' in self.path else 'codex'
        index = counts[host]; counts[host] += 1
        (RUN/f'{PREFIX[host]}-request-{index}.json').write_text(json.dumps(body, ensure_ascii=False), encoding='utf-8')
        (RUN/f'{PREFIX[host]}-request-{index}.path').write_text(self.path, encoding='utf-8')
        plan = PLANS[host]
        self.send_response(200); self.send_header('Content-Type', 'text/event-stream'); self.end_headers()

        def emit(event):
            self.wfile.write(('event: '+event['type']+'\ndata: '+json.dumps(event)+'\n\n').encode()); self.wfile.flush()
        if host == 'claude':
            if plan is not None:
                block = plan[min(index, len(plan) - 1)](body)
            elif index == 0:
                block = {'type': 'tool_use', 'id': 'tool_read', 'name': 'Read', 'input': {'file_path': str(RUN/'marketplace/plugins/crew/agents/frontend-architect.md')}}
            elif index == 1:
                block = {'type': 'tool_use', 'id': 'tool_read_history', 'name': 'Read', 'input': {'file_path': str(RUN/'claude-project/docs/work/2026-09/2026-09-07-immutable.md')}}
            elif index == 2:
                block = {'type': 'tool_use', 'id': 'tool_write', 'name': 'Write', 'input': {'file_path': str(RUN/'claude-project/docs/work/2026-09/2026-09-07-immutable.md'), 'content': 'INVALID REPLACEMENT\n'}}
            else:
                block = text('Controlled runtime smoke finished.')
            emit({'type': 'message_start', 'message': {'id': 'msg_'+str(index), 'type': 'message', 'role': 'assistant', 'model': body.get('model'), 'content': [], 'stop_reason': None, 'stop_sequence': None, 'usage': {'input_tokens': 100, 'output_tokens': 0}}})
            if block['type'] == 'tool_use':
                emit({'type': 'content_block_start', 'index': 0, 'content_block': {**block, 'input': {}}})
                emit({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'input_json_delta', 'partial_json': json.dumps(block['input'])}})
            else:
                emit({'type': 'content_block_start', 'index': 0, 'content_block': text('')})
                emit({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': block['text']}})
            emit({'type': 'content_block_stop', 'index': 0})
            emit({'type': 'message_delta', 'delta': {'stop_reason': 'tool_use' if block['type'] == 'tool_use' else 'end_turn', 'stop_sequence': None}, 'usage': {'output_tokens': 20}})
            emit({'type': 'message_stop'})
            return
        usage = {'input_tokens': 100, 'output_tokens': 20, 'total_tokens': 120}
        if plan is not None:
            item = plan[min(index, len(plan) - 1)](body)
            if isinstance(item, tuple):
                item, usage = item
        elif index <= 1:
            tool = next((t for t in body.get('tools', []) if t.get('name') == 'apply_patch'), None)
            patch = '*** Begin Patch\n*** Add File: should-not-exist.txt\n+valid first file\n*** Update File: docs/work/2026-09/2026-09-07-immutable.md\n@@\n-original immutable history\n+INVALID REPLACEMENT\n*** End Patch'
            if index == 0:
                patch = '*** Begin Patch\n*** Update File: module.py\n@@ def second():\n-        old\n+        changed\n*** End Patch'
            if tool and tool.get('type') == 'custom':
                item = {'type': 'custom_tool_call', 'id': 'tool_patch_'+str(index), 'call_id': 'call_patch_'+str(index), 'name': 'apply_patch', 'input': patch, 'status': 'completed'}
            else:
                item = function_call('apply_patch', {'command': patch}, 'call_patch')
        else:
            item = message('Controlled runtime smoke finished.')
        emit({'type': 'response.created', 'response': {'id': 'resp_'+str(index), 'object': 'response', 'status': 'in_progress', 'output': []}})
        emit({'type': 'response.output_item.added', 'output_index': 0, 'item': item})
        emit({'type': 'response.output_item.done', 'output_index': 0, 'item': item})
        emit({'type': 'response.completed', 'response': {'id': 'resp_'+str(index), 'object': 'response', 'status': 'completed', 'output': [item], 'usage': usage}})
