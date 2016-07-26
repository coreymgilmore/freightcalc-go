package quote

import (
	"bytes"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

//EASYPOST STUFF
const apiUrl = "https://api.easypost.com/v2/orders/"

//GET SHIPPING QUOTES
//calculate rates to ship this shipment of one or more packages
//this makes a "curl" style http request to easypost since easypost does not have a go library/api
func Get(w http.ResponseWriter, r *http.Request) {
	//GET FORM VALUES
	fromCity := r.FormValue("fromCity")
	fromState := strings.ToUpper(r.FormValue("fromState"))
	fromZip := r.FormValue("fromZip")
	fromCountry := strings.ToUpper(r.FormValue("fromCountry"))
	toCity := r.FormValue("toCity")
	toState := strings.ToUpper(r.FormValue("toState"))
	toZip := r.FormValue("toZip")
	toCountry := strings.ToUpper(r.FormValue("toCountry"))
	lengths := r.FormValue("lengths")
	widths := r.FormValue("widths")
	heights := r.FormValue("heights")
	weights := r.FormValue("weights")
	//numPackages := r.FormValue("numPackages")

	//split into slice of values
	//passed as comma separated strings in form value
	lengthList := strings.Split(lengths, ",")
	widthList := strings.Split(widths, ",")
	heightList := strings.Split(heights, ",")
	weightList := strings.Split(weights, ",")

	//GET WEIGHTS IN OUNCES
	//converting from string -> float -> string
	var weightListOunces []string
	for _, val := range weightList {
		//convert to float
		floatVal, _ := strconv.ParseFloat(val, 64)

		//multiply to ounces
		floatVal *= 16

		//convert to integer
		intVal := int(floatVal)

		//back to string
		strVal := strconv.Itoa(intVal)

		//push to array
		weightListOunces = append(weightListOunces, strVal)
	}

	//BUILD REQUEST
	//this saves the values we want to an object to submit to easypost
	//easypost defines the key names via their curl instructions
	v := url.Values{}

	//from address
	v.Set("order[from_address][company]", "From Company")
	v.Set("order[from_address][street1]", "From Street 1")
	v.Set("order[from_address][street2]", "From Street 2")
	v.Set("order[from_address][city]", fromCity)
	v.Set("order[from_address][state]", fromState)
	v.Set("order[from_address][zip]", fromZip)
	v.Set("order[from_address][country]", fromCountry)
	v.Set("order[from_address][phone]", "123-456-7890")
	v.Set("order[from_address][residential]", "false")

	//to address
	v.Set("order[to_address][company]", "To Company")
	v.Set("order[to_address][street1]", "To Street 1")
	v.Set("order[to_address][street2]", "To Street 2")
	v.Set("order[to_address][city]", toCity)
	v.Set("order[to_address][state]", toState)
	v.Set("order[to_address][zip]", toZip)
	v.Set("order[to_address][country]", toCountry)
	v.Set("order[to_address][phone]", "123-456-7890")
	v.Set("order[to_address][residential]", "false")

	//loop through each package
	//because we need to index the values in the call to easypost
	for index, value := range lengthList {
		length := value
		width := widthList[index]
		height := heightList[index]
		weight := weightListOunces[index]
		indexStr := strconv.Itoa(index)

		v.Set("order[shipments]["+indexStr+"][parcel][length]", length)
		v.Set("order[shipments]["+indexStr+"][parcel][width]", width)
		v.Set("order[shipments]["+indexStr+"][parcel][height]", height)
		v.Set("order[shipments]["+indexStr+"][parcel][weight]", weight)
	}

	//GET API KEY
	//this should be set in another file that is part of this package
	//for example: quote-apikey.go (package quote)
	//all this file has is the easypost apikey defined as a constant
	//this is done so that our api key is never pushed to github, etc.
	//**if you do not have a file with an apikey in the format "apiKey = ....", then this app will not compile
	//**you will get an error and this app will not run
	key := apiKey

	//GET THE FREIGHT RATES
	//http call to easypost's curl api
	c := &http.Client{}
	request, err := http.NewRequest("POST", apiUrl, bytes.NewBufferString(v.Encode()))
	if err != nil {
		log.Println("Error with http.NewRequest")
		w.Write([]byte("error"))
		return
	}

	//set authentication
	//aka our api key via http basic auth
	request.SetBasicAuth(key, "")

	//perform the call
	response, err := c.Do(request)
	if err != nil {
		log.Println("Error with client.Do")
		w.Write([]byte("error"))
		return
	}

	//READ THE RESPONSE BODY
	//the response body has our rates
	defer response.Body.Close()
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Println("Error with ioutil.ReadAll")
		w.Write([]byte("error"))
		return
	}

	//SEND BACK RESULTS TO AJAX CALL
	//this should be a json object
	w.WriteHeader(http.StatusOK)
	w.Write(body)
	return
}
