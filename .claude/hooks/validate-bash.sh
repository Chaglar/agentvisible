#!/bin/bash
COMMAND="$1"
if echo "$COMMAND" | grep -qE '(rm -rf /|sudo|chmod 777)'; then
    echo "BLOCKED: Unsafe command"; exit 1
fi
if echo "$COMMAND" | grep -q '.openclaw'; then
    echo "BLOCKED: Cannot access OpenClaw"; exit 1
fi
exit 0
