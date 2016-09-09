package templates

import (
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

//pathToTemplates is the directory where the template files are stored
//this is defined now so all funcs have access to it but a value is set to it during init()
var pathToTemplates = ""

//htmlTemplates stores the built and cached templates
var htmlTemplates *template.Template

//NotificationPage holds the data format for when building a notification page
type NotificationPage struct {
	PanelColor string
	Title      string
	Message    interface{}
	BtnColor   string
	LinkHref   string
	BtnText    string
}

//Get the path to the templates and get the templates ready for use
//need to determine GOPATH since this needs to be defined on all go systems
//html files aren't part of the "installed" package, they are separate files
func init() {
	//get path to files
	gopath := os.Getenv("GOPATH")
	pathToTemplates = gopath + "/src/github.com/coreymgilmore/freightcalc-go/website/html_templates/"

	//build templates
	//this will panic on errors
	build()
	return
}

//build gets the list of files from the pathToTemplates and builds the files in that directory into golang templates
//the templates are cached for use in the future by the app
func build() {
	//placeholder
	//this is the list of paths for each file in the pathToTemplates
	//need the path to each to be able to parse the files
	var paths []string

	//get list of files in the pathToTemplates directory
	files, err := ioutil.ReadDir(pathToTemplates)
	if err != nil {
		log.Panic(err)
		return
	}

	//get full file paths
	//we need the full paths to be able to build the templates, not relative paths
	//ignore any directories
	//this gets a list of paths (as strings) in an array
	for _, f := range files {
		if f.IsDir() {
			continue
		}

		path := pathToTemplates + f.Name()
		paths = append(paths, path)
	}

	//parse files into templates
	htmlTemplates = template.Must(template.ParseFiles(paths...))
	return
}

//Load displays a template
//data is a struct used to fill in data into the template
//used for actually showing the template to a user
func Load(w http.ResponseWriter, templateName string, data interface{}) {
	template := templateName + ".html"

	if err := htmlTemplates.ExecuteTemplate(w, template, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	return
}
