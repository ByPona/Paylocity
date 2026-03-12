Steps To Run the Tests
- npm install
- npx install playwright -> This will install the browsers required
- Create a .env file with the credentials -> WEBUSERNAME, WEBPASSWORD, APIKEY
- npx playwright test

There is a bug when test are run in parallel with the API, multiple 401 are returned. Then parallel execution is disabled

The bug reports are located inside the BugChallenge folder. They are split into UI Bugs and API Bugs, along with a Summary Test Report (.txt) file.
