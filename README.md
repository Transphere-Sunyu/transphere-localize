# Transphere L10N


## Quickstart

1. `yarn`
2. `yarn preview:plugin`
3. In Figma load your plugin by right-clicking `Plugins > Development > New Plugin`, and select the project's `manifest.json` file

4. In another window run `yarn preview:browser` 

4. To run the React app inside of Figma, run `yarn build:watch`

## Troubleshooting
- Ensure that only a *single* instance of the 'Preview App' is running in your browser and Figma. Multiple instances, can cause an infite feedback loop of messaages to occur.
- The indicator light on the 'Preview App' will turn red if the connection to the websocket server goes down. It will turn green once it reconnects
- If you wish to make changes to the 'preview-server.js' you will need to stop and rerun `yarn preview:browser` 
