package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/coreymgilmore/gocatandmini"

	"github.com/coreymgilmore/freightcalc-go/quote"
	"github.com/coreymgilmore/freightcalc-go/templates"
)

const (
	//WEB SERVER CONFIG
	//the port this app listens on
	//this port is proxied to port 80 (http) using nginx on the host server
	port = ":8000"

	//the directory off of the website root that hosts static files
	//www.example.com/static/
	staticWebDir = "/static"

	//the directory on the server where the static files are stored
	staticLocalDir = "/home/manager/go/src/github.com/coreymgilmore/freightcalc-go/website/static/"
)

//INITIALIZATION
//stuff to do before app actually starts running
func init() {
	//LOAD HTML TEMPLATES
	//this is the actual pages shown when browsed to
	templates.Build()

	minifyCss()
	minifyJs()

	log.Println("App initialized...done")
}

//MAIN FUNCTIONALITY OF APP
func main() {
	//ROUTER
	r := mux.NewRouter()
	r.StrictSlash(true)

	r.HandleFunc("/", userInterface).Methods("GET")
	r.HandleFunc("/quote/", quote.Get).Methods("GET")

	//STATIC ASSETS
	//css, js, etc.
	r.PathPrefix(staticWebDir).Handler(setStaticFileHeaders(http.StripPrefix(staticWebDir, http.FileServer(http.Dir(staticLocalDir)))))

	//ROOT FILES
	//anything served off the root directory
	//manifest.json, robots.txt, etc.
	r.PathPrefix("/").Handler(http.FileServer(http.Dir(staticLocalDir + "root_files/")))

	//LISTEN AND SERVE
	//this actually serves the website
	log.Println("App serving on port " + port)
	http.ListenAndServe(port, r)
}

//SET STATIC FILE HEADERS
//for setting cache control headers
func setStaticFileHeaders(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		//Cache-Control
		//dont transform images/etc, allow caching in intermediaries, browser will cache for 300sec, CDN will cache for 900sec.
		//w.Header().Set("Cache-Control", "no-transform,public,max-age=300,s-maxage=900")

		//FOR DEV
		//aka no caching

		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		//SERVE CONTENT
		h.ServeHTTP(w, r)
	})
}

//DISPLAY THE UI
func userInterface(w http.ResponseWriter, r *http.Request) {
	templates.Load(w, "index", nil)
	return
}

//MINIFIERS
func minifyCss() {
	inputDir := 	staticLocalDir + "css/"
	outputFile := 	inputDir + "styles.min.css"
	gocatandmini.CSS(inputDir, outputFile)
	return
}

func minifyJs() {
	inputDir := 	staticLocalDir + "js/"
	outputFile := 	inputDir + "script.min.js"
	gocatandmini.JS(inputDir, outputFile)
	return
}