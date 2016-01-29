# freightcalc-go
Calculate freight charges for small packages using UPS/FedEx.  Wraps around the Easypost API.


####Dependencies####
- Golang.
- Nginx to serve as a proxy, as necessary.
- [gocatandmini](https://github.com/coreymgilmore/gocatandmini) - Minify CSS and JS.
- [tdewolff/minify](https://github.com/tdewolff/minify) - Minify CSS and JS.
- An Easypost account.
- UPS/FedEx/etc. accounts.

####How It Works####
- You install this as a Golang app on webserver.
- You proxy a url to this app with Nginx as needed.
- Type in your From and To addresses (you can set the From address as a default).
- Provide your package dimensions (you can provide default options).
- Makes an API call to Easypost using your Easypost account (api key).
- Gets back the rates for the carriers you have set up in Easypost.