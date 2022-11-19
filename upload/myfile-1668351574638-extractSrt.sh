#!/bin/bash


declare -r __dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
declare -r __file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
declare -r __base="$(basename ${__file} .sh)"
declare -r __root="$(cd "$(dirname "${__dir}")" && pwd)" # <-- change this as it depends on your app

declare -r arg1="${1:-}"

declare dir="${1:-}"

if [ "${1:-}" = "" ]; then
  # when no parameter specified, use the current dir
  dir=${__dir}
fi

echo "extracting srt for dir: ${dir}"
echo arg1: ${arg1} __dir: ${__dir} __file: ${__file} __base: ${__base} __root: ${__root}


isFile=false
isDir=false
# if [ -d "${dir}" ]; then
if [ -f "${dir}" ]; then
  # when no parameter specified, use the current dir
  echo "file exists"
  isFile=true
elif [ -f "${dir}" ]; then
  echo "dir exists"
  isDir=true
else
  echo "Error: file/dir not exists!"
  exit 1
fi

function getFilename {
  theStr="${1:-}"
  thePath=$(echo ${theStr} | grep -oP ".*\/(?=[^/]+)")
  theFile="${theStr#${thePath}}"
  theNameOnly=${theFile%.*}
  echo "${theNameOnly}"
  # theNameOnly=${theFile%.*} && echo "nameOnly(without Extension): ${theNameOnly}"
}

function getDir {
  theStr="${1:-}"
  thePath=$(echo ${theStr} | grep -oP ".*\/(?=[^/]+)")
  echo "${thePath}"
}

if [ "${isFile:-}" = "true" ]; then
  echo "extracting a file"
  path=$(getDir "${dir}")
  cd ${path}
  pwd
  filename_ori=$(getFilename "${dir}")
  filename=${filename_ori}_extracted.srt
  echo "extract filename: ${filename} start.."
  echo ffmpeg.exe -i "${filename_ori}.mkv" "${filename}"
  ffmpeg.exe -i "${filename_ori}.mkv" "${filename}"
elif [ "${isDir:-}" = "true" ]; then
  echo "extracting a folder"
  cd ${dir}
  for file in ${dir}/*.mkv; do
  #  echo "extract file: ${file} start.."
    # getFilename "${file}"
    filename=$(getFilename "${file}")_extracted.srt
   # filename="$(getFilename ${file})_extracted.srt"
    echo "extract filename: ${filename} start.."
    ffmpeg.exe -i "${file}" "${filename}"
  done
else
  echo "Error: file/dir not exists!"
  exit 1
fi

