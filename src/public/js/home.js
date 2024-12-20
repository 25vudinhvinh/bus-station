let circles = []
let polylines = []
const map = L.map('map').setView([21.028333, 105.853333], 12); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const selectStops = document.querySelector('#select-stops')

fetch('/api/bus_stops')
.then(response => response.json())
.then(data => { 
    const uniqueRoute = new Set(data.map(stop => stop.route_id))
    uniqueRoute.forEach(route => {
        const selectStop = document.createElement('option')
        selectStop.value = route
        selectStop.innerHTML = route
        selectStops.appendChild(selectStop)
    })

    selectStops.addEventListener('change', (event) => {
        const selectValue = event.target.value

        circles.forEach(item => map.removeLayer(item.circle))
        polylines.forEach(item => map.removeLayer(item.polyline))


        circles = []
        polylines = []


      fetch('/api/bus_paths')
        .then(response => response.json())
        .then(data => {
            data.forEach(path => {
                if (path.route_id === selectValue) {
                    const coordinates = path.geom[0].map(point => [point[1], point[0]]) 
                        const polyline = L.polyline(coordinates, { color: 'red' }).addTo(map)
                        polylines.push({ route_id: path.route_id, polyline: polyline })
                }
            })
        })



           data.forEach(stop => {
            if (selectValue == stop.route_id) {
                const [longitude, latitude] = stop.geom
                const circle = L.circle([latitude, longitude], {
                    color: 'white',
                    fillColor: 'white',
                    fillOpacity: 1,
                    radius: 30,
                }).addTo(map)
                circles.push({ route_id: stop.route_id, circle: circle })
            }
        })
    })
})