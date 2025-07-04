## Setup dev environment
```bash
# Clone code
git clone git@github.com:rchrch/homebridge-mhacwifi1-lan.git
cd homebridge-mhacwifi1-lan
# Start docker environment with current node version
docker compose up -d
```
## Building the code
```bash
# "Shell" into the docker environment
docker exec -it dev -- bash

# Install the required dependencies
npm install .

# Build the code
npm run build
ln -s .. node_modules/homebridge-mhacwifi1-lan
```

## Running in test mode
```bash
# Directly
node_modules/.bin/homebridge -U config/ -I -Q -D

# or with npm (that handles automatically rebuilding the code)
npm run homnebridge
```

## Publishing a new release
```bash
npm run prepublishOnly
git tag NEW-VERSION
git push --tags
npm run prepublishOnly
npm login
npm publish
```
