# Introduction
This is a sample/template project made using the MERN stack (Mongodb, Express, React, Node). 
It was made to learn more about the stack and how one authenticates with JWT tokens. 

This project was made by Filip, but it was based on a lot of different tutorials out there.

# Setting up the project

## Prerequisites 
- A MongoDB Atlas service. This is a free service and is easy to setup. Go watch a youtube video on it if you want, but it should be fairly self-explanatory.
- A code editor. I used webstorm, it has a 30-day free trial if you want to try it. I highly recommend it. I tried to use vscode as a lot of people do, but there is just so many extensions to set up correctly before it works like it should.
- Node. I used v18.16.1


## How to start the app
1. Get the MONGO_URI from the MongoDB atlas instance and paste it into the corresponding variable in the -env file in the backend folder.
2. Generate a random password for the SECRET variable in the .env folder. Use a password generator for this, make it at least 30 random characters.
3. Navigate to the root folder "MERN" containing both the backend and frontend folder
4. Run the command "npm run setup". This will install all packages required for both the backend and the frontend parts of the code
5. Then run the command "npm run start". This will run both the frontend and the backend server concurrently in the same terminal. To run them separately, cd into both of the folders and run "npm run dev" for the backend, and "npm run start" for the frontend.


# Packages used in the project
## Frontend
- React
- React-router-dom
- Redux
- MUI
- react-hook-form
- yup
- date-fns

## Backend
- bcrpyt
- cors
- dotenv
- express
- jsonwebtoken
- mongoose
- validator
