//begin script when window loads
window.onload = setMap();

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
/*
    var projection = d3.geoAlbers()
        .center([0, 46.2])
        .rotate([90,0,0])
        .parallels([42, 46])
        .scale(500)
        .translate([width / 2, height / 2]);
*/
    var projection = d3.geoAlbers()
        .center([-14.55, 30.24])
        
        .rotate([88.27, -16.36, 0])
        
        .parallels([4.50, 25.00])
        
        .scale(2700)
        
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    var promises = [
        d3.csv("data/county_data_new.csv"),
        d3.json("data/States.topojson"),
        d3.json("data/Counties.topojson"),
        
    ];
    Promise.all(promises).then(callback);

    function callback(data) {

    

        var csvData = data[0],
            world = data[1],
            montana = data[2];

        var worldCountries = topojson.feature(world, world.objects.ne_10m_admin_1_states_provinces),
            montanaCounties = topojson.feature(montana,montana.objects.ne_10m_admin_2_counties).features;

       console.log(data)
       console.log(worldCountries)
    
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