//begin script when window loads
(function(){
    
    var attrArray = ["varA", "varB", "varC", "varD", "varE"];

    var expressed = attrArray[0];

    window.onload = setMap();


    


    //Example 1.3 line 4...set up choropleth map
    function setMap() {
        //use Promise.all to parallelize asynchronous data loading

        var width = window.innerWidth * 0.5,
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

        var countries = map
                .append("path")
                .datum(worldCountries)
                .attr("class","countries")
                .attr("d",  path);

        var colorScale = makeColorScale(csvData);
        
        montanaCounties = joinData(montanaCounties, csvData);
        setEnumerationUnits(montanaCounties, map, path, colorScale);
        
        setChart(csvData,colorScale);
        }
    };

/*
    function setGraticule(map, path){
        //...GRATICULE BLOCKS FROM Week 8
    };
  */



//STILL ONE PROBLEM!!!!!! THE NUMBERS ARE STRINGS WHEN THEY NEED TO BE INTEGERS
    function joinData(montanaCounties, csvData){
         //loop through csv to assign each set of csv attribute values to geojson region
         for (var i = 0; i < csvData.length; i++) {
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.County; //the CSV primary key
            console.log('print this', csvRegion)   
    
            //loop through geojson regions to find correct region
            for (var a = 0; a < montanaCounties.length; a++) {
            var geojsonProps = montanaCounties[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.NAME; //the geojson primary key
            
                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey) {
                    //assign all attributes and values
                    attrArray.forEach(function (attr) {
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };
        
    
        return montanaCounties;
    };
    
    //Example 1.4 line 11...function to create color scale generator
    function makeColorScale(data){
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build two-value array of minimum and maximum expressed attribute values
        var minmax = [
            d3.min(data, function(d) { return parseFloat(d[expressed]); }),
            d3.max(data, function(d) { return parseFloat(d[expressed]); })
        ];
        //assign two-value array as scale domain
        colorScale.domain(minmax);

        return colorScale;
    };

    function setEnumerationUnits(montanaCounties, map, path, colorScale){
        //...REGIONS BLOCK FROM Week 8
          //add counties  to map
          var countiesZ = map
          .selectAll(".countiesZ")
          .data(montanaCounties)
          .enter()
          .append("path")
          .attr("class", function (d) {
              return "countiesZ " + d.properties.NAME;
          })
          .attr("d", path)        
          .style("fill", function(d){            
              var value = d.properties[expressed];            
              if(value) {                
                  return colorScale(d.properties[expressed]);            
              } else {                
                  return "#ccc";            
              }    
      });
  }

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([0, 0.5])
        .domain([0, 100]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.adm1_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};
  /* old chart that doesn't work
//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
//create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //change the range from [0, chartHeight] to [0,.5] as this actually gets the bar chart to show up
    var yScale = d3.scaleLinear()
        .range([0, .5])
        .domain([0, 105]);
     //set bars for each province




     var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.County;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
       
        //Example 2.5 line 23...end of bars block
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

    //annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.adm1_code;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        });

    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Population aged 18 and over in each county");


    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

        */

})();

 
