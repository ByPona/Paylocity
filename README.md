Steps To Run the Tests
- npm install
- npx install playwright -> This will install the browsers required
- Create a .env file with the credentials -> WEBUSERNAME, WEBPASSWORD, APIKEY
- npx playwright test

There is a bug when test are run in parallel with the API, multiple 401 are returned. Then parallel execution is disabled
