//begin script when window loads
window.onload = setMap();

//Example 1.3 line 4...set up choropleth map
function setMap() {
    //use Promise.all to parallelize asynchronous data loading

    var promises = [
        d3.csv("data/county_data_new.csv"),
        d3.json("data/Counties.topojson"),
        d3.json("data/States.topojson"),
    ];
    Promise.all(promises).then(callback);

    function callback(data) {
       console.log(data)
       /* var csvData = data[0],
            europe = data[1],
            france = data[2];
        console.log(csvData);
        console.log(europe);
        console.log(france);
        */
    }
}