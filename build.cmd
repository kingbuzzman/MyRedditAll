F:\coffee\bin\node F:\coffee\bin\coffee --compile --output js\ coffee\
packer -o res\main.js -m jsmin js\*.js
compass compile .
packer -o res\main.css -m cssmin css\*.css
