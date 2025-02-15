# Mentorship Web Application


## Prerequisites

Install [Node.js v14](https://nodejs.org/download/release/v14.17.5/). Ensure you check the checkbox which lets the system install neccessary build tools. Check Node.js is installed by running `node -v` in terminal.  


### Docker:
#### Enable virtualisation in your BIOS
Go into **Turn Windows Features On and Off** (search this in the start menu) and tick virtual machine platform, windows subsystem for linux and HyperV
Install Docker, and WSL if prompted:
https://docs.docker.com/desktop/windows/install/


## Start-up
## Frontend
- Run `npm install --global yarn` to install Yarn. Check Yarn is installed by running `yarn -v`.
- (Front-End) Run `yarn install` in client directory to install dependencies.

## Backend

In the /backend directory:

### The easy way:
#### Powershell:
In powershell, you must run:
`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

- **Build:** Run the `buildd.ps1` script

- **Start/Restart:** Run the `startd.ps1` script

- **Stop:** Run the `stopd.ps1` script. This will preserve database changes. If you want to stop quickly, ignore this script and stop the `startd.ps1`.

- **Remove:** Run the `removed.ps1` script. This will remove the containers. Database changes will not be preserved. Ignore any error message; part of the script is used to check that there are no dangling volumes or images.

Docker containers can be removed seperately of one another using `docker rm CONTAINER_ID`. The container ID may be found by running `docker container ls`.

#### Bash:
The powershell scripts should work in bash, but we aren't making any promises. You may need to change their extensions from `.ps1` to `.sh`, or add `#!/usr/bin/bash` in the first line of each. The same goes for any other terminal.

### The hard way(s):
- **Build:** Run `docker-compose build`

- **Start:** `docker-compose up` or `docker-compose up -d ` to run in the background. Add `--build` to build at the same time.  

- **Stop:** `docker-compose down`  
    If you ctrl+c then the images and volumes won't be removed.  

- **Clean restart:**  
    `docker rm -f $(docker ps -a -q)` (removes stopped containers)  
    `docker volume rm $(docker volume ls -q)` (removes volumes)  

- **View current containers:** `docker ps -al`  

- **View Current Images:** `docker images`  

- **Remove image** (not usually necessary)**:** `docker rmi <imagename>`  
- **Remove any dangling images** (run this if `docker images` displays images with a tag of <none>)**:** `docker rmi $(docker images -f “dangling=true” -q)`  
- **Start and build the docker instance with a compose file not named 'docker-compose.yml':** `docker-compose -f <filename> --build`  

### Database connection  
Run:  
`docker exec -it backend-db-1 psql -U postgres -d discipulo`
to execute queries in the PostgreSQL REPL.  

## Development
The project follows the git model described [here](https://nvie.com/posts/a-successful-git-branching-model/). Ensure you have read and understood the model before starting. 

### Front-End
- Run `yarn start` in client directory to launch the website on localhost:3000. 
- Check client/src/index.js for implemented pages.

The stack being used is:  
- [REACT](https://reactjs.org/docs/hello-world.html) 
- Node.js + Express.js
- PostgreSQL

## Troubleshooting
- If `yarn install` complains about Python. Remove Python3 PATH in the system environment variables. Install Pyhton2 v2.7 and add the "C:\...\Python27" and "C:\...\Python27\Scripts" to the system environment variable PATH.
- If yarn complains about nodemon not being installed, try running `yarn global add nodemon`.
- If Powershell doesn't want to run yarn because it doesn't like scripts, open powershell as an administrator and run `Set-ExecutionPolicy Unrestricted`. 
- If Postman is not getting a response and isn't saying why, turn off `SSL Certificate Verification` in settings.
