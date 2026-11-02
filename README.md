# petclinic-frontdesk

Small Angular 19 app standing in for a micro-frontend that runs alongside the
petclinic host app (`petclinic-angular-demo`) and reads the host's shared state
through a browser "host bridge" (`window.petclinicHost` + DOM events).

Used to test the SDLC-Harness store hand-off: a downstream story attaches the
host's `src/app/store/` folder as its contract.

Build: `npm install && npx ng build --configuration development`
