# Node Web App using Microsoft Graph

This is a simple node web app that enables users to access information in the Microsoft graph.  

Users login in with Azure Active Directory - spefically they can use organizations and if they have enabled HTTPS it also supports personal accounts.

The app demonstrates how to create a long running (offline) connection to the information in the users's Microsoft graph; read access to mail or tasks; and the ability to read and write extensions to the user's profile.

## Minimilist Approach

This is designed to show the minimum set of steps required to create an app that integrates with the Microsoft graph.  

To ensure the required steps are clear no middleware or authentication libraries are used. 



To keep the code easy to read the design leverage ES2016 async/await syntax and uses Typescript for type checking.

Only two small special-purpose npm runtime dependences are used: 
* *restify* for the web server
* *node-fetch* for HTTP requests using async/await.

## Building

First clone the repo.  Then:

`> npm install`

`> npm run build`

## Thanks

To RichDizz for the initial golden thread demonstrating how to get long-runniung access.


