// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  firebase: {
    projectId: 'adacad-weaver',
    appId: '1:949203732957:web:0effb79b656553d62e0e34',
    databaseURL: 'https://adacad-weaver.firebaseio.com',
    storageBucket: 'adacad-weaver.appspot.com',
    locationId: 'us-central',
    apiKey: 'AIzaSyC5lSe7NkzFdJkAMUNeh78t7SqLL9r6foU',
    authDomain: 'adacad-weaver.firebaseapp.com',
    messagingSenderId: '949203732957',
    measurementId: 'G-F33KWLP936',
  },
  production: false
};
