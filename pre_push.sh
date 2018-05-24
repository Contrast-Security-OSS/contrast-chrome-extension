#!/usr/bin/env bash

# NOTE: YOU MUST INSTALL GNU SED FIRST
# With Homebrew: brew install gnu-sed

# get files that have console.log
console_log_files=$(grep -lr 'console.log' js --exclude-dir jquery --exclude-dir .git)

# search lines with console.log in console_log_files and remove the line
for cfile in $console_log_files; do
  gsed -i '/console.log/d' $cfile
done

debugger_files=$(grep -lr 'debugger' js --exclude-dir jquery --exclude-dir .git)
for dfile in $debugger_files; do
  gsed -i '/debugger/d' $dfile
done

# search for localhost in utils file
localhost_file=$(grep -lr 'localhost' js/util.js)
for lfile in $localhost_file; do
  gsed -i '/localhost/d' $lfile
done
