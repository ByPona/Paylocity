Steps To Run the Tests
- npm install
- npx install playwright -> This will install the browsers required
- Create a .env file with the credentials -> WEBUSERNAME, WEBPASSWORD, APIKEY
- npx playwright test

There is a bug when test are run in parallel with the API, multiple 401 are returned. Then parallel execution is disabled

The bug reports are located inside the BugChallenge folder. They are split into UI Bugs and API Bugs, along with a Summary Test Report (.txt) file.

3 Automated Test are failing because:
- Bug when user uses wrong Username in the login, deals to a 405 HTTP Error page
- I implementend screenshot testing to the Employee's grid inside the Dashboard Page, this can deal to flakiness
- Decimals are allow into the dependents input, system should not allow this so I expect an error in the network response, but this is not happening
