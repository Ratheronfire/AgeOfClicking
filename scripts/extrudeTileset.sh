filename="${1%.*}"
extension="${1##*.}"

echo Extruding ${filename}.${extension} into ${filename}-extruded.${extension}

npx tile-extruder --tileWidth 48 --tileHeight 48 --input ${filename}.${extension} --output ${filename}-extruded.${extension}