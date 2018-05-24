#!/usr/bin/env bash

# NOTE: YOU MUST INSTALL GNU SED FIRST
# With Homebrew: brew install gnu-sed

# get files that have console.log
console_log_files=$(grep -lr 'console.log' js/*.js)

# search lines with console.log in console_log_files and remove the line
for file in $console_log_files; do
  echo "Removing console.logs from $file"
  $(sed -i '/console.log/d' $file)
done

debugger_files=$(grep -lr 'debugger' js/*.js)
for file in $debugger_files; do
  echo "Removing debuggers from $file"
  $(sed -i '/debugger/d' $file)
done

# search for localhost in utils file
localhost_file=$(grep -lr 'localhost' js/util.js)
for file in $localhost_file; do
  echo "Removing localhost from $file"
  $(sed -i '/localhost/d' $file)
done

current_branch=$(git branch | grep -e "^*" | cut -d' ' -f 2)

echo "Current Branch is $current_branch"

$($current_branch git add .)
$($current_branch git commit --amend)
