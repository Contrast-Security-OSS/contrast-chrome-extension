#!/usr/bin/env bash

# get files that have console.log
console_log_files=$(grep -lr 'console.log' js --exclude-dir jquery --exclude-dir .git)

# search lines with console.log in console_log_files and remove the line
for file in $console_log_files; do
  sed -i '/console.log/d' $file
done

debugger_files=$(grep -lr 'debugger' js --exclude-dir jquery --exclude-dir .git)
for file in $debugger_files; do
  sed -i '/debugger/d' $file
done

debugger_files=$(grep -lr 'debugger' js --exclude-dir jquery --exclude-dir .git)
for file in $debugger_files; do
  sed -i '/debugger/d' $file
done

# search for localhost in utils file
localhost_file=$(grep -lr 'localhost' js/util.js)
for file in $localhost_file; do
  sed -i '/localhost/d' $file
done
