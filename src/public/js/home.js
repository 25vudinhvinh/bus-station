let circles = [];
let polylines = [];
const map = L.map('map').setView([21.028333, 105.853333], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let nearbyStops = [];
let userLocationMarker = null;
const selectStops = document.querySelector('#select-stops');
const routeList = document.querySelector('.route-list');
console.log(routeList);

fetch('/api/bus_stops')
    .then(response => response.json())
    .then(stopsData => {
        const uniqueRoutes = new Set(stopsData.map(stop => stop.route_id));
        uniqueRoutes.forEach(route => {
            const option = document.createElement('option');
            option.value = route;
            option.innerHTML = route;
            selectStops.appendChild(option);
        });

        selectStops.addEventListener('change', (event) => {
            const selectedRoute = event.target.value;

            // Remove existing layers
            circles.forEach(item => map.removeLayer(item.circle));
            polylines.forEach(item => map.removeLayer(item.polyline));
            routeList.innerHTML = '';
            circles = [];
            polylines = [];

            // Fetch and display route path
            fetch('/api/bus_paths')
                .then(response => response.json())
                .then(pathsData => {
                    pathsData.forEach(path => {
                        if (path.route_id === selectedRoute) {
                            const coordinates = path.geom[0].map(point => [point[1], point[0]]);
                            const polyline = L.polyline(coordinates, {
                                color: 'red',
                                weight: getDynamicWeight(map.getZoom()) // Initial line weight
                            }).addTo(map);

                            polylines.push({ route_id: path.route_id, polyline });

                            // Place points (stops) on the route
                            stopsData.forEach(stop => {
                                if (stop.route_id === selectedRoute) {
                                    const listStop = stop.stop_name;
                                    routeList.innerHTML += `<li>${listStop}</li>`;
                                    const [longitude, latitude] = stop.geom;
                                    const circle = L.circleMarker([latitude, longitude], {
                                        color: 'red',
                                        fillColor: 'white',
                                        fillOpacity: 1,
                                        radius: getDynamicRadius(map.getZoom()) 
                                    }).addTo(map);

                                    circle.bindPopup(`Tuyến: ${stop.route_id}<br>Điểm dừng: ${stop.stop_name}`);
                                    circles.push({ route_id: stop.route_id, circle });
                                }
                            });
                        }
                    });
                });
        });
    });

// Dynamic sizing based on zoom level
function getDynamicRadius(zoom) {
    return Math.max(4, zoom - 8); // Adjust size: min 4, increases with zoom
}

function getDynamicWeight(zoom) {
    return Math.max(2, (zoom - 8) * 0.5); // Adjust line thickness: min 2
}

// Adjust point and line sizes on zoom
map.on('zoomend', () => {
    const zoom = map.getZoom();
    circles.forEach(item => item.circle.setRadius(getDynamicRadius(zoom)));
    polylines.forEach(item => item.polyline.setStyle({ weight: getDynamicWeight(zoom) }));
});

function showStopNear() {
    map.locate({ setView: true, maxZoom: 14 });

    map.on('locationfound', (e) => {
        const userLatLng = e.latlng;

        if (userLocationMarker) {
            map.removeLayer(userLocationMarker);
        }

        userLocationMarker = L.circleMarker(userLatLng, {
            color: 'white',
            fillColor: 'green',
            fillOpacity: 0.5,
            radius: 8
        }).addTo(map)
        .bindPopup("Vị trí của bạn")
        .openPopup();

        fetch('/api/bus_stops')
            .then(response => response.json())
            .then(stopsData => {
                const radius = 3000;
                let stopsInRadius = [];

                stopsData.forEach(stop => {
                    const [stopLon, stopLat] = stop.geom;
                    const stopLatLng = L.latLng(stopLat, stopLon);
                    const distance = userLatLng.distanceTo(stopLatLng);

                    if (distance <= radius) {
                        stopsInRadius.push({ ...stop, distance });
                    }
                });

                stopsInRadius.forEach(stop => {
                    const [stopLon, stopLat] = stop.geom;
                    const stopLatLng = L.latLng(stopLat, stopLon);

                    const marker = L.circleMarker(stopLatLng,{
                        color: 'white',
                        fillColor: 'red',
                        fillOpacity: 1,
                        radius: 8
                    }).addTo(map)
                    .bindPopup(
                        `Điểm dừng: ${stop.stop_name}<br>
                        Tuyến: ${stop.route_id}<br>
                        Khoảng cách: ${(Math.round(stop.distance)/1000).toFixed(2)} km`
                    )

                  
                    // Lưu marker vào mảng nearbyStops
                    nearbyStops.push(marker);
                });
                if (stopsInRadius.length === 0) {
                    alert("Không có điểm dừng nào trong bán kính 3km.");
                }
            })
    });
}

function deleteSelect() {
    const selectStops = document.querySelector('#select-stops');
    if (selectStops) {
        selectStops.selectedIndex = 0;
    }

    circles.forEach(item => map.removeLayer(item.circle));
    circles = [];

    polylines.forEach(item => map.removeLayer(item.polyline));
    polylines = [];

    const routeList = document.querySelector('.route-list');
    if (routeList) {
        routeList.innerHTML = '';
    }

    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
        userLocationMarker = null;
    }

    // Xóa các điểm dừng ở gần
    nearbyStops.forEach(marker => map.removeLayer(marker));
    nearbyStops = []; // Làm trống mảng nearbyStops
    map.setView([21.028333, 105.853333], 12);
}
