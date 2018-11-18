# A Web App for the Microsoft Graph buid in Node

This is simple web app that enables long-running access to information in the Microsoft graph.  It is built in node.

Users login with Azure Active Directory.  It supports login with Azure AD organization identities and, if the node server is enabled with HTTPS, it also supports Microsoft personal accounts.

The app shows how to maintain a long-running (offline) connection to the Microsoft graph enabling the node app to read mail or tasks and read and write to an extension on the user's profile.  The OAUTH2 refresh_token is used to update the access_token when it expires.

The app uses an independent bearer secret to avoid storing any PII in the web app.

## Minimilist Approach

This project is intended to show the minimum set of steps required for an app to integrate with the Microsoft graph.  

To ensure the required steps are clear and the app logic is easy to follow no middleware or authentication libraries are used. 

To keep the code easy to read the app uses async/await syntax.

Typescript is used in the *src* directory.  The *lib* directory contains a pure ES2018 javascript implementation.

To keep the app simple, the app uses just two small, unopionated, limited-purpose npm runtime libraries: 
* *restify* for the web server
* *node-fetch* for HTTP requests using async/await.

So the demonstrated approach should be easy to implement on small devices or with other frameworks or languages.

## Building

First clone the repo.  Then:


`> npm install`

`> npm run build`


## Configuration

The app needs to be registered with Azure AD.  This does not require admin access.  

Once the app id and secret are known they should be placed into environment variables for the app to pick them up.

## To Do

* Confirm that patch works if the key doesn't exist.


## Thanks

To RichDizz for an app with the golden thread demonstrating how to get long-runniung access.
