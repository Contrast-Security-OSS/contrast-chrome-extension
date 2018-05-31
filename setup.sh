GIT_DIR=$(git rev-parse --git-dir)
echo "Installing Git hooks..."
# this command creates symlink to our pre-commit script
if [ -L $GIT_DIR/hooks/pre-push ]; then
    echo "Git hooks found, skipping"
else
  ln -s ../../scripts/pre_push.sh $GIT_DIR/hooks/pre-push
  chmod +x scripts/pre_push.sh
fi
