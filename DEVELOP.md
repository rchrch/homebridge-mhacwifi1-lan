## Setup dev environment
```bash
git clone git@github.com:rchrch/homebridge-mhacwifi1-lan.git
cd homebridge-mhacwifi1-lan
npm install
ln -s .. node_modules/homebridge-mhacwifi1-lan
```

## Running in test mode
```bash
node_modules/.bin/homebridge -U config/ -I -Q -D
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
