//begin script when window loads
window.onload = setMap();


var attrArray = ["varA", "varB", "varC", "varD", "varE"];


//Example 1.3 line 4...set up choropleth map
function setMap() {
    //use Promise.all to parallelize asynchronous data loading

    var width = 960,
        height = 460;

    var map = d3.select("body")
        .append("svg")
        .attr("class","map")
        .attr("width", width)
        .attr("height", height);

    var projection = d3.geoAlbers()
    .center([-20.82, 27.75])

    .rotate([82.82, -20.91, 0])
    
    .parallels([0.00, 0.00])
    
    .scale(3977.78)
    
    .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    var promises = [
        d3.csv("data/county_data_new.csv"),
        d3.json("data/States.topojson"),
        d3.json("data/montanaCounties.topojson"),
        
    ];
    Promise.all(promises).then(callback);

    function callback(data) {

    

        var csvData = data[0],
            world = data[1],
            montana = data[2];

        var worldCountries = topojson.feature(world, world.objects.ne_10m_admin_1_states_provinces),
            montanaCounties = topojson.feature(montana,montana.objects.MontanaCounties).features;


       //console.log(data)
       //console.log(worldCountries)


       // NEW CODE BETWEEN THESE COMMENTS
       

       //loop through csv to assign each set of csv attribute values to geojson region
       for (var i = 0; i < csvData.length; i++) {
         var csvRegion = csvData[i]; //the current region
         var csvKey = csvRegion.County; //the CSV primary key
   
         //loop through geojson regions to find correct region
         for (var a = 0; a < world.length; a++) {
           var geojsonProps = world[a].properties; //the current region geojson properties
           var geojsonKey = geojsonProps.County; //the geojson primary key
   
           //where primary keys match, transfer csv data to geojson properties object
           if (geojsonKey == csvKey) {
             //assign all attributes and values
             attrArray.forEach(function (attr) {
               var val = parseFloat(csvRegion[attr]); //get csv attribute value
               geojsonProps[attr] = val; //assign attribute and value to geojson properties
             });
           }
         }
       }
       //console.log(world);
       console.log(csvData)
       
    

              // NEW CODE BETWEEN THESE COMMENTS

       var countries = map
            .append("path")
            .datum(worldCountries)
            .attr("class","countries")
            .attr("d",  path);

     

        
        //add counties  to map
        var counties = map
            .selectAll(".counties")
            .data(montanaCounties)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "counties " + d.properties.adm1_code;
            })
            .attr("d", path);

        
    }
}