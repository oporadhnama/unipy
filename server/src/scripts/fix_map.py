import os

def fix_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    for old, new in replacements:
        text = text.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_file('src/routes/proxy.ts', [
    # 783
    ('(await (await [...toolCallAcc.entries()]', '(await Promise.all([...toolCallAcc.entries()]'),
    # 789
    ('})))', '})))'), # Wait, if I replace the top, the parens might be mismatched
    # 892
    ('respMsg.tool_calls = (await rescue.calls.map(async (c, i) => ({', 'respMsg.tool_calls = await Promise.all(rescue.calls.map(async (c, i) => ({')),
    # 896
    ('})));', '})));'), # parenthesis count for Promise.all is correct if the array map is closed
])

fix_file('src/routes/responses.ts', [
    ('let toolCalls = (await (msg?.tool_calls ?? []).map(async (tc) => ({', 'let toolCalls = await Promise.all((msg?.tool_calls ?? []).map(async (tc) => ({')),
    ('toolCalls = (await rescue.calls.map(async (c, i) => ({', 'toolCalls = await Promise.all(rescue.calls.map(async (c, i) => ({')),
])

print("Fixed array map promises")
