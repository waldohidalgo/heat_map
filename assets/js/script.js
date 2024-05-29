import { months, colors } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const { baseTemperature, monthlyVariance } = await d3.json(
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
  );

  const data = monthlyVariance.map((d) => {
    return { ...d, temperature: d.variance + baseTemperature };
  });

  const arrayValuesMinimoMaximoTemperatura = d3.extent(
    data,
    (d) => d.temperature
  );
  const minimoTemperatura = arrayValuesMinimoMaximoTemperatura[0];
  const maximoTemperatura = arrayValuesMinimoMaximoTemperatura[1];

  const colorScale = d3.scaleQuantize(
    arrayValuesMinimoMaximoTemperatura,
    colors
  );

  const limitesColores = [
    minimoTemperatura,
    ...colorScale.thresholds(),
    maximoTemperatura,
  ];

  //creación de margen y dimensiones
  const margin = { top: 100, right: 50, bottom: 100, left: 150 };
  const width = 1500 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  //creación de svg

  const svg = d3
    .select(".container_graph")
    .html("")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "#eee");

  // Eje Y
  const yScale = d3.scaleBand().domain(months).range([0, height]);

  const yAxis = d3.axisLeft(yScale).tickSize(12);

  const gy = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .attr("id", "y-axis")
    .call(yAxis);

  const yLabel = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .append("text")
    .attr("id", "y-label")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Months")
    .attr("class", "y-label");

  // Eje X
  const xScale = d3
    .scaleUtc()
    .domain(d3.extent(data, (d) => new Date(d.year, 0, 1)))
    .range([0, width]);

  const widthEachRectangle =
    xScale(new Date(2015, 0, 1)) - xScale(new Date(2014, 0, 1));

  const xAxis = d3
    .axisBottom(xScale)
    .ticks(d3.timeYear.every(10))
    .tickFormat(d3.timeFormat("%Y"));

  xAxis.tickSize(12);

  const gx = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top + height})`)
    .attr("id", "x-axis")
    .call(xAxis);

  const xLabel = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top + height + 10})`)
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .text("Years")
    .attr("class", "x-label");

  // Creación de rectángulos
  const rect = svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => margin.left + xScale(new Date(d.year, 0, 1)))
    .attr("y", (d) => margin.top + yScale(months[d.month - 1]))
    .attr("width", widthEachRectangle)
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) => {
      return colorScale(d.temperature);
    })
    .attr("class", "cell")
    .attr("data-month", (d) => d.month - 1)
    .attr("data-year", (d) => d.year)
    .attr("data-temp", (d) => d.temperature);

  // Creación de tooltips
  const tooltip = d3
    .select(".container_graph")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .style("display", "none");

  rect.on("mouseover", function (event, d) {
    const { year, month, variance, temperature } = d;
    const tooltipElement = document.getElementById("tooltip");
    tooltipElement.style.setProperty(
      "--box-shadow-color",
      colorScale(temperature)
    );

    const [x, y] = d3.pointer(event);

    tooltip
      .style("display", "block")
      .html(
        `<strong>-Year:</strong> ${year}<br/>
        <strong>-Month:</strong> ${months[month - 1]}<br/>
        <strong>-Temperature:</strong> ${temperature.toFixed(2)} °C
        <br/>
        <strong>-Variance ${variance > 0 ? "🌞" : "❄️"}: </strong>${
          variance > 0 ? "+" : ""
        }${variance.toFixed(2)} °C `
      )
      .style("left", function () {
        const xPosition =
          x > 1260 ? x - this.offsetWidth - 20 + "px" : x + 20 + "px";
        return xPosition;
      })
      .style("top", function () {
        const yPosition =
          margin.top + yScale(months[month - 1]) > 385
            ? y - this.offsetHeight - 20 + "px"
            : y + 20 + "px";
        return yPosition;
      })
      .attr("data-year", year);

    d3.select(this)
      .style("stroke", "black")
      .style("stroke-width", "3px")
      .style("cursor", "pointer");
  });

  rect.on("mouseout", function () {
    tooltip.style("display", "none");
    d3.select(this).style("stroke", "none");
  });

  // Creación de leyenda

  const scaleColorLegend = d3
    .scaleLinear()
    .domain(arrayValuesMinimoMaximoTemperatura)
    .range([0, 300]);

  const ejeLegend = d3
    .axisBottom(scaleColorLegend)
    .tickSize(6)
    .tickValues(limitesColores)
    .tickFormat((d) => d.toFixed(2));

  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top / 2})`)
    .attr("id", "legend")
    .call(ejeLegend);

  // creacion de rectangulos de la leyenda

  const widthRectLegend =
    scaleColorLegend(limitesColores[1]) - scaleColorLegend(limitesColores[0]);

  legend
    .selectAll("rect")
    .data(limitesColores.slice(0, -1))
    .enter()
    .append("rect")
    .attr("x", (d) => scaleColorLegend(d))
    .attr("y", -widthRectLegend)
    .attr("width", widthRectLegend)
    .attr("height", widthRectLegend)
    .attr("fill", (d, i) => colors[i])
    .attr("stroke", "black");
});
