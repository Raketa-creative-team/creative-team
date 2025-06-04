#!/bin/sh
git config core.hooksPath .githooks
git config --global push.autoSetupRemote true
echo "✅ Git hooks are now active from .githooks"
