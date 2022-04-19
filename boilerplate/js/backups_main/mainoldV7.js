//begin script when window loads
(function(){
    
    var attrArray = ["varA", "varB", "varC", "varD", "varE"]; //follow format of example with var

    var expressed = attrArray[0];

      //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";  

    
        


//change the range from [0, chartHeight] to [0,.5] as this actually gets the bar chart to show up
    var yScale = d3.scaleLinear()
    .range([chartHeight, 0]) //range has to be very low otherwise the bars will be huge (think about the difference in my data to the example data)
    .domain([0,200]);

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
            //you'll only use worldCOuntries as the background, you won't interact with it
            //montanaCounties is the important one
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
        createDropdown(csvData);
        
        //updateChart();
        }
    };

/*
    function setGraticule(map, path){
        //...GRATICULE BLOCKS FROM Week 8
    };
  */



//STILL ONE PROBLEM!!!!!! THE NUMBERS ARE STRINGS WHEN THEY NEED TO BE INTEGERS. Actually this doesn't matter...
    function joinData(montanaCounties, csvData){
         //loop through csv to assign each set of csv attribute values to geojson region
         for (var i = 0; i < csvData.length; i++) {
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.County; //the CSV primary key, use county for csv (cell 1)
            console.log('print this', csvRegion)   
    
            //loop through geojson regions to find correct region
            for (var a = 0; a < montanaCounties.length; a++) {
            var geojsonProps = montanaCounties[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.NAME; //the geojson primary key, It's actually NAME
            
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
    //change color later when you have time
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
        
          //add counties  to map
          var countiesZ = map //use countiesZ so I don't get confused what I am looking at
          .selectAll(".countiesZ")
          .data(montanaCounties)
          .enter()
          .append("path")
          .attr("class", function (d) {
              return "countiesZ " + d.properties.NAME; //NAME works even though it's a different color
          })
          .attr("d", path)        
          .style("fill", function(d){            
              var value = d.properties[expressed];            
              if(value) {                
                  return colorScale(d.properties[expressed]);            
              } else {                
                  return "#ccc";            
              }    
            })
          .on("mouseover", function (event, d) {
                highlight(d.properties);
        });
  }

//function to create coordinated bar chart
function setChart(csvData, colorScale){
  
    //create a second svg element to hold the bar chart
    
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    var chartBackground = chart
            .append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

    //creating the y axis line
    var yAxis = d3.axisLeft(yScale);

    var axis1 = chart.append("g")
        .attr("class","axis1")
        .attr("transform", "translate(26,0)")
        .call(yAxis)

     //set bars for each county in the dataset
     var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.County; //change to county from the .adm in example
        })
        .attr("width", chartWidth / csvData.length - 1)

        .on("mouseover", function (event, d) {
            highlight(d);
        })
        .attr("x", function(d, i){
            return i * (chartWidth / csvData.length);
        })
        .attr("height", function(d){
            return yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed]));
        })
       
        //Example 2.5 line 23...end of bars block
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });
/*
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
        .attr("x", 20)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Population aged 18 and over in each county");
        */
    updateChart(bars, csvData.length, colorScale); //controls the initial bar chart before you select an attribute
};

function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change",function(){
            changeAttribute(this.value,csvData);
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d; })
        .text(function(d){ return d; });
};

function changeAttribute(attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    var counties = d3
        .selectAll(".countiesZ")
        .transition()
        .duration(1000)
        .style("fill", function (d) {
            var value = d.properties[expressed];
            if (value) {
                return colorScale(value);
            } else {
                return "#ccc";
            }
        });
    // //THIS SETS THE COLORS ON THE MAP, ESSENTIALLY COPIED FROM FUNCTION SETENUMERATION UNITS AT .STYLE("FILL")
    // var counties = d3.selectAll(".countiesZ").style("fill", function (d) {
    //     var value = d.properties[expressed];
    //     if (value) {
    //         return colorScale(d.properties[expressed]);
    //     } else {
    //         return "#ccc";
    //     }
    // });

    var min =  d3.min(csvData, function(d) { return parseFloat(d[expressed])});

    var max = d3.max(csvData, function(d) { return parseFloat(d[expressed])});

    
    var yScale = d3.scaleLinear()
    .range([chartHeight, 0]) 
    .domain([min, max]);

    // var yAxis = d3.axisLeft(yScale);

    // var axis2 = axis1.append("g")
    //     .attr("class","axis2")
    //     .attr("transform", "translate(30,0)")
    //     .call(yAxis)

    //  IS IT BARS OR BAR
    var bars = d3
            .selectAll(".bars")
            //re-sort bars
            .sort(function (a, b) {
                return b[expressed] - a[expressed];
            })
            .transition() //add animation
            .delay(function (d, i) {
                return i * 20;
            })
            .duration(500);
            // .attr("x", function(d, i){
            //     return i * (chartInnerWidth / csvData.length) + leftPadding;
            // })
            // //resize bars
            // .attr("height", function(d, i){
            //     return 463 - yScale(parseFloat(d[expressed]));
            // })
            // .attr("y", function(d,i){
            //     return yScale(parseFloat(d[expressed])) + topBottomPadding;
            // })
            // //recolor bars
            // .style("fill", function(d){
            // var value = d[expressed];
            // if(value){
            //     return colorScale(value);
            // }else{
            //     return "#ccc";
            // }
            // });
    updateChart(bars, csvData.length, colorScale);

}//bracket ends function changeAttribute

function updateChart(bars, n, colorScale) {
    //position bars
    bars.attr("x", function (d, i) {
        return i * (chartInnerWidth / n) + leftPadding;
    })
        //size/resize bars
        .attr("height", function (d, i) {
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function (d, i) {
            return yScale(parseFloat(d[expressed])) + 5;
        })
        //color/recolor bars
        .style("fill", function (d) {
            var value = d[expressed];
            if (value) {
                return colorScale(value);
            } else {
                return "#ccc";
            }
        });

    }


    //function to highlight enumeration units and bars
    function highlight(props) {
        //change stroke
        var selected = d3
            .selectAll("." + props.countiesZ)
            .style("stroke", "blue")
            .style("stroke-width", "2");
    }

})();

 
