# `@ircam/eslint-config`

Shareable eslint config for the Ircam ISMM team JavaScript projects, see [https://eslint.org/docs/latest/developer-guide/shareable-configs](https://eslint.org/docs/latest/developer-guide/shareable-configs)

## Usage


1. Install the package

```sh
npm install --save-dev eslint @ircam/eslint-config
```

2. Create a `eslint.config.js` file in your project containing

```js
export { default } from '@ircam/eslint-config';
```

3. In the `package.json`, add the following command to your npm scripts

```json
"scripts": {
  "lint": "npx eslint src"
}
```

## Notes

From `v2.0.0` this package targets `eslint` >= 9

For previous version of `eslint` use the `v1.x.x` of this package


## License

BSD-3-Clause
