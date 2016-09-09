package main

import (
	"log"
	"net/http"
	"os"

	"github.com/coreymgilmore/freightcalc-go/quote"
	"github.com/coreymgilmore/freightcalc-go/templates"
	"github.com/coreymgilmore/gocatandmini"
	"github.com/gorilla/mux"
)

//WEB SERVER CONFIG
const (
	//port is the localhost port this server listens on
	//port 80 on the server is proxied to this prot by nginx
	//this port should not be accessible outside the server
	port = ":8000"

	//staticWebDir is the directory off of the website root that hosts static files
	//www.example.com/static/
	staticWebDir = "/static"

	//gopathSubDirStaticFiles is the subdirectory from the system's gopath where static files are stored
	//this is used to set the staticLocalDir once the gopath is determined in init()
	gopathSubDirStaticFiles = "/src/github.com/coreymgilmore/freightcalc-go/website/static/"
)

//staticLocalDir is the directory on the server where static files are stored
//the value is set in init() by determining the gopath
var staticLocalDir = ""

func init() {
	//get path for static files
	gopath := os.Getenv("GOPATH")
	staticLocalDir = gopath + gopathSubDirStaticFiles

	//minify css and js
	minifyCss()
	minifyJs()

	log.Println("App initialized...done")
	return
}

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

		//FOR DEV aka no caching
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
	inputDir := staticLocalDir + "css/"
	outputFile := inputDir + "styles.min.css"
	gocatandmini.CSS(inputDir, outputFile)
	return
}
func minifyJs() {
	inputDir := staticLocalDir + "js/"
	outputFile := inputDir + "script.min.js"
	gocatandmini.JS(inputDir, outputFile)
	return
}
