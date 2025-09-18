#!/usr/bin/env sh
# abort on errors
#set -e
# build
npm run build
# navigate into the build output directory
cd build
# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME
# git init
# git add -A
# git commit -m 'deploy'
# git push -f https://github.com/UnstableDesign/AdaCAD_Documentation.git main:gh-pages
# cd -
scp -r * ld@artfordorks.com:/home/ld/docs.adacad.org/html
